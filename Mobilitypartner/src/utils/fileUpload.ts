import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Get uploads directory path
const getUploadsDir = () => path.join(process.cwd(), 'public', 'uploads', 'products');

// Ensure uploads directory exists with proper error handling
const ensureUploadsDir = () => {
  const uploadsDir = getUploadsDir();
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    // Don't throw - let multer handle the error if directory is not writable
  }
  return uploadsDir;
};

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists at upload time
    const uploadsDir = ensureUploadsDir();

    // Check if directory is writable
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      cb(null, uploadsDir);
    } catch (error) {
      console.error('Uploads directory not writable:', uploadsDir, error);
      cb(new Error('Upload directory is not writable. Please check server permissions.'), uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const handleFileUpload = (req: any, res: any) => {
  return new Promise((resolve, reject) => {
    upload.single('pdfFile')(req, res, async (err) => {
      if (err) {
        reject(err);
      } else {
        // If a file was uploaded, verify it's accessible
        if (req.file) {
          try {
            // Force filesystem sync by opening the file and using fsync
            const fd = fs.openSync(req.file.path, 'r');
            fs.fsyncSync(fd);
            fs.closeSync(fd);

            // Small delay to ensure Docker volume sync
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file exists and is readable
            fs.accessSync(req.file.path, fs.constants.R_OK);
            const stats = fs.statSync(req.file.path);
            console.log('File uploaded and verified:', req.file.path, 'size:', stats.size);
          } catch (verifyError) {
            console.error('File verification failed:', verifyError);
          }
        }
        resolve({
          file: req.file,
          fields: req.body
        });
      }
    });
  });
};