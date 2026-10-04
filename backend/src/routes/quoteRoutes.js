import express from 'express';
import { createQuotation, getProjectQuotations, updateQuotationStatus } from '../controllers/quoteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createQuotation);
router.get('/project/:projectId', getProjectQuotations);
router.patch('/:quoteId/status', updateQuotationStatus);

export default router;
