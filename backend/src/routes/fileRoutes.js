import express from 'express';
import path from 'path';
import fs from 'fs';
import { getFilePath, saveUploadedFile } from '../services/storageService.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/download/:fileKey', (req, res) => {
  const filePath = getFilePath(req.params.fileKey);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  res.sendFile(filePath);
});

// Direct photo / file upload
router.post(
  '/upload',
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      throw new ApiError(400, 'Please select at least one file to upload.');
    }

    const savedFiles = [];
    for (const file of files) {
      const saved = await saveUploadedFile(file);
      savedFiles.push(saved);
    }

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      files: savedFiles,
      urls: savedFiles.map((f) => f.url),
      url: savedFiles[0].url,
    });
  })
);

export default router;
