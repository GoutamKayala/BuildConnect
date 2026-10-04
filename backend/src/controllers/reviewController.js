import Review from '../models/Review.js';
import Project from '../models/Project.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const createReview = asyncHandler(async (req, res) => {
  const { projectId, rating, comment } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  const isClient = project.client.toString() === req.user._id.toString();
  const isWorker = project.assignedWorker && project.assignedWorker.toString() === req.user._id.toString();

  if (!isClient && !isWorker) {
    throw new ApiError(403, 'Only project participants can leave a review.');
  }

  const revieweeId = isClient ? project.assignedWorker : project.client;
  if (!revieweeId) {
    throw new ApiError(400, 'Cannot review unassigned project.');
  }

  const existing = await Review.findOne({ project: projectId, reviewer: req.user._id });
  if (existing) {
    throw new ApiError(400, 'You have already submitted a review for this project.');
  }

  const review = await Review.create({
    project: projectId,
    reviewer: req.user._id,
    reviewee: revieweeId,
    reviewerRole: req.user.role,
    rating: Number(rating),
    comment,
  });

  // If reviewing a worker, recalculate worker average rating
  if (isClient) {
    const workerProfile = await WorkerProfile.findOne({ user: revieweeId });
    if (workerProfile) {
      const allWorkerReviews = await Review.find({ reviewee: revieweeId, reviewerRole: 'CLIENT' });
      const avg = allWorkerReviews.reduce((sum, r) => sum + r.rating, 0) / allWorkerReviews.length;
      workerProfile.avgRating = Math.round(avg * 10) / 10;
      workerProfile.reviewsCount = allWorkerReviews.length;
      workerProfile.completedProjectsCount += 1;
      await workerProfile.save();
    }
  }

  // Update project stage
  project.stage = 'REVIEWED';
  if (project.status !== 'COMPLETED') {
    project.status = 'COMPLETED';
  }
  await project.save();

  await Notification.create({
    recipient: revieweeId,
    sender: req.user._id,
    type: 'REVIEW_RECEIVED',
    title: 'New Review Received!',
    message: `${req.user.name} rated you ${rating} stars: "${comment.substring(0, 50)}..."`,
    link: `/workers/${revieweeId}`,
  });

  await logAudit({
    actorId: req.user._id,
    action: 'CREATE_REVIEW',
    resource: 'Review',
    resourceId: review._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review,
  });
});

export const getReviewByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const review = await Review.findOne({ project: projectId })
    .populate('reviewer', 'name avatarUrl role')
    .populate('reviewee', 'name avatarUrl role');

  res.json({
    success: true,
    review: review || null,
  });
});
