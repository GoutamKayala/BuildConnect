import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const saveUploadedFile = async (file) => {
  const fileExt = path.extname(file.originalname);
  const randomName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;
  const targetPath = path.join(UPLOAD_DIR, randomName);

  if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer);
  } else if (file.path && file.path !== targetPath) {
    fs.copyFileSync(file.path, targetPath);
    try { fs.unlinkSync(file.path); } catch (e) {}
  }

  return {
    fileKey: randomName,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/api/files/download/${randomName}`,
  };
};

export const getFilePath = (fileKey) => {
  return path.join(UPLOAD_DIR, fileKey);
};
