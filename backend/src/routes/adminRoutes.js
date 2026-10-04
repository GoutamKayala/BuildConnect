import express from 'express';
import {
  getAdminMetrics,
  getUsersAdmin,
  updateUserStatus,
  getVerificationsAdmin,
  reviewVerificationAdmin,
  getAuditLogsAdmin,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireRole('ADMIN'));

router.get('/metrics', getAdminMetrics);
router.get('/users', getUsersAdmin);
router.patch('/users/:id/status', updateUserStatus);
router.get('/verifications', getVerificationsAdmin);
router.patch('/verifications/:id', reviewVerificationAdmin);
router.get('/audit-logs', getAuditLogsAdmin);

export default router;
