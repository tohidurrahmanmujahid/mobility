import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

// Content type mapping
const contentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.avif': 'image/avif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
};

// Allowed subdirectories for security
const allowedTypes = ['products', 'claims', 'workshop-submissions'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set CORS headers for the response
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { type, file } = req.query;

    // Validate type parameter
    if (!type || typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    // Validate file parameter
    if (!file || typeof file !== 'string') {
      return res.status(400).json({ message: 'Invalid file parameter' });
    }

    // Security: Prevent directory traversal by checking for path separators and ..
    if (file.includes('/') || file.includes('\\') || file.includes('..')) {
      return res.status(403).json({ message: 'Invalid file name' });
    }

    // Build the file path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', type);
    const filePath = path.join(uploadsDir, file);

    // Double-check path is within uploads directory
    const normalizedPath = path.resolve(filePath);
    const normalizedUploadsDir = path.resolve(uploadsDir);
    if (!normalizedPath.startsWith(normalizedUploadsDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      console.error('File not found:', normalizedPath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(normalizedPath);
    if (!stats.isFile()) {
      return res.status(404).json({ message: 'Not a file' });
    }

    // Determine content type
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Read and send file
    const fileBuffer = fs.readFileSync(normalizedPath);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    return res.send(fileBuffer);

  } catch (error: any) {
    console.error('File serve error:', error?.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
