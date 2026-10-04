import express from 'express';
import { createAgreement, signAgreement, getAgreementByProject } from '../controllers/agreementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createAgreement);
router.post('/:id/sign', signAgreement);
router.get('/project/:projectId', getAgreementByProject);

export default router;
