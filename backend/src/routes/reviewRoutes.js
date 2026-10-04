import express from 'express';
import { createReview, getReviewByProject } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/project/:projectId', protect, getReviewByProject);

export default router;
