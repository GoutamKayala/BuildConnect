import express from 'express';
import { processMilestonePayment, getInvoices, downloadInvoicePDF } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/process', processMilestonePayment);
router.get('/invoices', getInvoices);
router.get('/invoices/:id/download', downloadInvoicePDF);

export default router;
