import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    propertyType,
    estimatedBudget,
    preferredStartDate,
    expectedCompletionDate,
    publicLocation,
    exactAddress,
    assignedWorkerId,
    images,
  } = req.body;

  if (!title || !description || !category || !publicLocation?.city) {
    throw new ApiError(400, 'Title, description, category, and city are required.');
  }

  const project = await Project.create({
    client: req.user._id,
    assignedWorker: assignedWorkerId || null,
    title,
    description,
    category,
    propertyType: propertyType || 'Apartment',
    estimatedBudget: Number(estimatedBudget) || 0,
    preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
    expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
    publicLocation,
    exactAddress: exactAddress || {},
    locationSharedWithWorker: false,
    status: assignedWorkerId ? 'REQUESTED' : 'DRAFT',
    stage: 'PLANNING',
    images: images || [],
  });

  if (assignedWorkerId) {
    await Notification.create({
      recipient: assignedWorkerId,
      sender: req.user._id,
      type: 'PROJECT_REQUEST',
      title: 'New Project Invitation',
      message: `${req.user.name} invited you to quote for "${title}"`,
      link: `/worker/projects/${project._id}`,
    });
  }

  await logAudit({
    actorId: req.user._id,
    action: 'CREATE_PROJECT',
    resource: 'Project',
    resourceId: project._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project,
  });
});

export const getProjects = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'CLIENT') {
    filter.client = req.user._id;
  } else if (req.user.role === 'WORKER') {
    filter.$or = [
      { assignedWorker: req.user._id },
      { status: 'REQUESTED' },
    ];
  } else if (req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Forbidden');
  }

  const projects = await Project.find(filter)
    .populate('client', 'name avatarUrl city phone')
    .populate('assignedWorker', 'name avatarUrl phone')
    .sort({ updatedAt: -1 });

  // Sanitize exactAddress for projects where location is not authorized for current user
  const sanitized = projects.map((p) => {
    const pObj = p.toObject();
    const isOwner = pObj.client._id.toString() === req.user._id.toString();
    const isAssigned = pObj.assignedWorker && pObj.assignedWorker._id.toString() === req.user._id.toString();
    const canSeeAddress = req.user.role === 'ADMIN' || isOwner || (isAssigned && pObj.locationSharedWithWorker);

    if (!canSeeAddress) {
      delete pObj.exactAddress;
    }
    return pObj;
  });

  res.json({
    success: true,
    count: sanitized.length,
    projects: sanitized,
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'name avatarUrl email phone city')
    .populate('assignedWorker', 'name avatarUrl email phone city');

  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  const isOwner = project.client._id.toString() === req.user._id.toString();
  const isAssigned = project.assignedWorker && project.assignedWorker._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwner && !isAssigned && !isAdmin) {
    throw new ApiError(403, 'Unauthorized access to project details.');
  }

  const projectObj = project.toObject();
  const canSeeAddress = isAdmin || isOwner || (isAssigned && project.locationSharedWithWorker);

  if (!canSeeAddress) {
    delete projectObj.exactAddress;
  }

  res.json({
    success: true,
    project: projectObj,
    locationAuthorized: canSeeAddress,
  });
});

export const shareLocationWithWorker = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  if (project.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the project owner client can authorize location sharing.');
  }

  project.locationSharedWithWorker = true;
  await project.save();

  if (project.assignedWorker) {
    await Notification.create({
      recipient: project.assignedWorker,
      sender: req.user._id,
      type: 'SITE_VISIT_APPROVAL',
      title: 'Location Access Granted',
      message: `${req.user.name} shared full project location for "${project.title}"`,
      link: `/worker/projects/${project._id}`,
    });
  }

  await logAudit({
    actorId: req.user._id,
    action: 'SHARE_PROJECT_LOCATION',
    resource: 'Project',
    resourceId: project._id,
    req,
  });

  res.json({
    success: true,
    message: 'Exact location access granted to worker',
    exactAddress: project.exactAddress,
  });
});

export const updateProjectStage = asyncHandler(async (req, res) => {
  const { stage, status } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  const isOwner = project.client.toString() === req.user._id.toString();
  const isWorker = project.assignedWorker && project.assignedWorker.toString() === req.user._id.toString();

  if (!isOwner && !isWorker && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Unauthorized');
  }

  if (stage) project.stage = stage;
  if (status) project.status = status;

  await project.save();

  res.json({
    success: true,
    message: 'Project status updated',
    project,
  });
});
