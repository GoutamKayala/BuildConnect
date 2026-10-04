import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const getProjectMilestones = asyncHandler(async (req, res) => {
  const milestones = await Milestone.find({ project: req.params.projectId }).sort({ createdAt: 1 });
  res.json({
    success: true,
    count: milestones.length,
    milestones,
  });
});

export const createMilestone = asyncHandler(async (req, res) => {
  const { projectId, title, description, amount, dueDate } = req.body;

  const milestone = await Milestone.create({
    project: projectId,
    title,
    description: description || '',
    amount: Number(amount) || 0,
    dueDate: dueDate ? new Date(dueDate) : null,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
  });

  res.status(201).json({
    success: true,
    message: 'Milestone added',
    milestone,
  });
});

export const updateMilestoneStatus = asyncHandler(async (req, res) => {
  const { status, completionPercentage, attachments } = req.body;
  const milestone = await Milestone.findById(req.params.id);

  if (!milestone) {
    throw new ApiError(404, 'Milestone not found.');
  }

  if (status) milestone.status = status;
  if (completionPercentage !== undefined) milestone.completionPercentage = Number(completionPercentage);
  if (attachments) milestone.attachments = attachments;

  if (status === 'COMPLETED' || status === 'APPROVED') {
    milestone.paymentStatus = 'PAYABLE';
  }

  await milestone.save();

  const project = await Project.findById(milestone.project);
  const notifyRecipient = req.user._id.toString() === project.client.toString() ? project.assignedWorker : project.client;

  if (notifyRecipient) {
    await Notification.create({
      recipient: notifyRecipient,
      sender: req.user._id,
      type: 'MILESTONE_UPDATE',
      title: `Milestone Status: ${status}`,
      message: `Milestone "${milestone.title}" updated to ${status}`,
      link: `/projects/${project._id}`,
    });
  }

  await logAudit({
    actorId: req.user._id,
    action: 'UPDATE_MILESTONE',
    resource: 'Milestone',
    resourceId: milestone._id,
    req,
  });

  res.json({
    success: true,
    message: 'Milestone status updated',
    milestone,
  });
});
