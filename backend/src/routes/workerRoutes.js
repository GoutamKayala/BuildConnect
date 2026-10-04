import express from 'express';
import {
  getWorkers,
  getWorkerById,
  getMyWorkerProfile,
  updateWorkerProfile,
  addPortfolioItem,
  deletePortfolioItem,
  likePortfolioItem,
  uploadVerificationDocument,
  getKycStatus,
  verifyAadhaar,
  verifyPan,
  getPayoutSettings,
  updatePayoutSettings,
} from '../controllers/workerController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getWorkers);
router.get('/profile/me', protect, requireRole('WORKER'), getMyWorkerProfile);
router.put('/profile', protect, requireRole('WORKER'), updateWorkerProfile);
router.get('/kyc/status', protect, requireRole('WORKER'), getKycStatus);
router.post('/kyc/verify-aadhaar', protect, requireRole('WORKER'), upload.single('document'), verifyAadhaar);
router.post('/kyc/verify-pan', protect, requireRole('WORKER'), upload.single('document'), verifyPan);
router.get('/payout-settings', protect, requireRole('WORKER'), getPayoutSettings);
router.post('/payout-settings', protect, requireRole('WORKER'), updatePayoutSettings);
router.get('/:id', getWorkerById);
router.post('/portfolio', protect, requireRole('WORKER'), addPortfolioItem);
router.delete('/portfolio/:id', protect, requireRole('WORKER'), deletePortfolioItem);
router.post('/portfolio/:id/like', protect, likePortfolioItem);
router.post('/verification', protect, requireRole('WORKER'), upload.single('document'), uploadVerificationDocument);

export default router;
