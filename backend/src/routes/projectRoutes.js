import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  shareLocationWithWorker,
  updateProjectStage,
} from '../controllers/projectController.js';
import { requestSiteVisit, updateSiteVisitStatus } from '../controllers/siteVisitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProjectStage);
router.post('/:id/share-location', shareLocationWithWorker);

// Site Visit nested routes
router.post('/:id/site-visits', requestSiteVisit);
router.patch('/:id/site-visits/:visitId', updateSiteVisitStatus);

export default router;
