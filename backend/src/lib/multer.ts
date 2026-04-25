import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { NextApiRequest } from 'next';

// Get uploads directory path
const getUploadDir = () => path.join(process.cwd(), 'public', 'uploads', 'claims');

// Ensure uploads directory exists with proper error handling
const ensureUploadDir = () => {
  const uploadDir = getUploadDir();
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created claims upload directory:', uploadDir);
    }
  } catch (error) {
    console.error('Error creating claims upload directory:', error);
  }
  return uploadDir;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists at upload time
    const uploadDir = ensureUploadDir();

    // Check if directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Claims upload directory not writable:', uploadDir, error);
      cb(new Error('Upload directory is not writable. Please check server permissions.'), uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter to accept only images and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',      // iPhone HEIC format
    'image/heif',      // iPhone HEIF format
    'image/avif',      // Modern format
    'application/pdf',
    'application/octet-stream', // Fallback for iPhone when MIME type detection fails
  ];

  // Also check file extension for iPhone compatibility (sometimes MIME type is wrong)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.avif', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname, 'MIME:', file.mimetype, 'Ext:', ext);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP, HEIC) and PDF files are allowed.`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file (iPhone photos can be large)
    files: 15, // Max 15 files
    fieldSize: 10 * 1024 * 1024, // 10MB for non-file fields
  },
});

// Helper to run multer middleware in Next.js API routes
export const runMiddleware = (req: any, res: any, fn: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Helper to verify uploaded files are accessible (handles Docker volume sync)
const verifyUploadedFiles = (files: any) => {
  if (!files) return;

  const allFiles = [
    ...(files.meterReadingImage || []),
    ...(files.descriptionFiles || [])
  ];

  for (const file of allFiles) {
    try {
      // Force filesystem sync by opening and closing the file
      const fd = fs.openSync(file.path, 'r');
      fs.closeSync(fd);
      console.log('File verified:', file.path);
    } catch (error) {
      console.error('File verification failed:', file.path, error);
    }
  }
};

// Helper to parse multipart form data
export const parseMultipartForm = async (req: NextApiRequest, res: any) => {
  const multerUpload = upload.fields([
    { name: 'meterReadingImage', maxCount: 1 },
    { name: 'descriptionFiles', maxCount: 10 },
  ]);

  await runMiddleware(req, res, multerUpload);

  // Verify uploaded files are accessible
  verifyUploadedFiles((req as any).files);
};

// Helper to get relative file paths for database storage
export const getRelativeFilePath = (absolutePath: string): string => {
  // Extract just the filename
  const filename = path.basename(absolutePath);
  // Return URL using the new file serving API
  return `/api/files/serve?type=claims&file=${filename}`;
};
