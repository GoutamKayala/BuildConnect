import express from 'express';
import { updateClientProfile } from '../controllers/clientController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, requireRole('CLIENT'), updateClientProfile);

export default router;
