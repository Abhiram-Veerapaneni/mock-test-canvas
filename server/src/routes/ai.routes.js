import express from 'express';
import multer from 'multer';
import { ingestDocument } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Memory storage for incoming docx or image uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMime = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];

  const ext = file.originalname.toLowerCase();
  const isAllowedExt = /\.(pdf|docx|doc|png|jpg|jpeg|webp)$/.test(ext);

  if (allowedMime.includes(file.mimetype) || isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format: ${file.mimetype}. Allowed formats: PDF (.pdf), Word (.docx), and images (.png, .jpg, .webp).`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
});

// Protected route for AI question ingestion
router.post('/ingest', protect, upload.single('document'), ingestDocument);

export default router;
