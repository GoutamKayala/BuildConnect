import express from 'express';
import { getProjectMilestones, createMilestone, updateMilestoneStatus } from '../controllers/milestoneController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getProjectMilestones);
router.post('/', createMilestone);
router.patch('/:id/status', updateMilestoneStatus);

export default router;
