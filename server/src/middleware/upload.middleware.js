import multer from 'multer';

/**
 * Upload Middleware
 *
 * Configures Multer with memory storage for incoming violation snapshot
 * image buffers. No disk writes — the buffer is streamed directly to
 * Cloudinary from memory.
 *
 * Limits:
 *  - Max file size: 5 MB
 *  - Accepted MIME types: image/jpeg, image/png, image/webp
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP are accepted.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * Middleware for single violation snapshot upload.
 * Expects the field name 'snapshot' in the multipart form.
 */
export const uploadSnapshot = upload.single('snapshot');

export default upload;
