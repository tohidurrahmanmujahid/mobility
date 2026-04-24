import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Get uploads directory path
const getUploadsDir = () => path.join(process.cwd(), 'public', 'uploads', 'workshop-submissions');

// Ensure uploads directory exists with proper error handling
const ensureUploadsDir = () => {
  const uploadsDir = getUploadsDir();
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created workshop uploads directory:', uploadsDir);
    }
  } catch (error) {
    console.error('Error creating workshop uploads directory:', error);
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
      console.error('Workshop uploads directory not writable:', uploadsDir, error);
      cb(new Error('Upload directory is not writable. Please check server permissions.'), uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// File filter to allow images and documents
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Uploading file:', file.originalname, 'MIME type:', file.mimetype);
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',      // iPhone HEIC format
    'image/heif',      // iPhone HEIF format
    'image/avif',      // Modern format
    // Documents
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream', // Fallback for iPhone when MIME type detection fails
  ];

  // Also check file extension for iPhone compatibility
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.avif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname, 'MIME:', file.mimetype, 'Ext:', ext);
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP, HEIC) and documents (PDF, DOC, DOCX, XLS, XLSX) are allowed'));
  }
};

export const workshopUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file (iPhone photos can be large)
    files: 20, // Maximum 20 files total
    fieldSize: 10 * 1024 * 1024, // 10MB for non-file fields
  }
});

export interface WorkshopUploadResult {
  uploadedImages: Express.Multer.File[];
  uploadedDocs: Express.Multer.File[];
  fields: any;
}

// Helper to verify uploaded files are accessible (handles Docker volume sync)
const verifyUploadedFiles = (files: Express.Multer.File[]) => {
  for (const file of files) {
    try {
      // Force filesystem sync by opening and closing the file
      const fd = fs.openSync(file.path, 'r');
      fs.closeSync(fd);
      console.log('Workshop file verified:', file.path);
    } catch (error) {
      console.error('Workshop file verification failed:', file.path, error);
    }
  }
};

export const handleWorkshopFileUpload = (req: any, res: any): Promise<WorkshopUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadFields = workshopUpload.fields([
      { name: 'uploadedImages', maxCount: 10 },
      { name: 'uploadedDocs', maxCount: 10 }
    ]);

    uploadFields(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        const uploadedImages = (req.files as any)?.uploadedImages || [];
        const uploadedDocs = (req.files as any)?.uploadedDocs || [];

        // Verify all uploaded files are accessible
        verifyUploadedFiles([...uploadedImages, ...uploadedDocs]);

        resolve({
          uploadedImages,
          uploadedDocs,
          fields: req.body
        });
      }
    });
  });
};
