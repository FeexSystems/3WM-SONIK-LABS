import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';

// Define size limits
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed MIME types
const ALLOWED_AUDIO_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

// Setup memory storage instead of disk for serverless/container flexibility
// Files will be processed from memory or uploaded to cloud storage
const storage = multer.memoryStorage();

/**
 * Filter for audio uploads
 */
const audioFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
  }
};

/**
 * Filter for image uploads
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed.`));
  }
};

/**
 * Multer middleware for Audio uploads
 */
export const audioUpload = multer({
  storage,
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 5, // max 5 files at a time
  },
  fileFilter: audioFileFilter,
});

/**
 * Multer middleware for Image uploads
 */
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1, // single image upload for avatars/covers
  },
  fileFilter: imageFileFilter,
});

/**
 * Helper to generate a secure random filename
 */
export const generateSecureFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomBytes}${ext}`;
};
