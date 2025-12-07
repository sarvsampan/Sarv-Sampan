import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP allowed'), false);
  }
};

// Upload config
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Upload single image
export const uploadSingle = upload.single('image');

// Upload multiple images (max 10)
export const uploadMultiple = upload.array('images', 10);
