import SiteVisit from '../models/SiteVisit.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const requestSiteVisit = asyncHandler(async (req, res) => {
  const { projectId, visitDate, notes } = req.body;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  const isWorker = req.user.role === 'WORKER';
  const isClient = req.user.role === 'CLIENT';

  if (!isWorker && !isClient) {
    throw new ApiError(403, 'Only client or worker can request site visit.');
  }

  // Assign worker if not yet set
  if (isWorker && !project.assignedWorker) {
    project.assignedWorker = req.user._id;
  }
  project.status = 'SITE_VISIT_PENDING';
  project.stage = 'SITE_VISIT';
  await project.save();

  const visit = await SiteVisit.create({
    project: project._id,
    client: project.client,
    worker: isWorker ? req.user._id : project.assignedWorker,
    requestedBy: req.user.role,
    visitDate: visitDate ? new Date(visitDate) : null,
    notes: notes || '',
    status: 'REQUESTED',
  });

  const recipientId = isWorker ? project.client : project.assignedWorker;
  if (recipientId) {
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'SITE_VISIT_REQUEST',
      title: 'Site Visit Requested',
      message: `${req.user.name} requested a site inspection for "${project.title}"`,
      link: `/projects/${project._id}`,
    });
  }

  await logAudit({
    actorId: req.user._id,
    action: 'REQUEST_SITE_VISIT',
    resource: 'SiteVisit',
    resourceId: visit._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Site visit request submitted',
    siteVisit: visit,
  });
});

export const updateSiteVisitStatus = asyncHandler(async (req, res) => {
  const { status, visitDate, notes, inspectionPhotos } = req.body;
  const visit = await SiteVisit.findById(req.params.visitId);

  if (!visit) {
    throw new ApiError(404, 'Site visit record not found.');
  }

  if (status) visit.status = status;
  if (visitDate) visit.visitDate = new Date(visitDate);
  if (notes) visit.notes = notes;
  if (inspectionPhotos) visit.inspectionPhotos = inspectionPhotos;

  await visit.save();

  if (status === 'APPROVED') {
    // Automatically enable location access when client approves site visit!
    await Project.findByIdAndUpdate(visit.project, { locationSharedWithWorker: true });
  }

  res.json({
    success: true,
    message: `Site visit status updated to ${status}`,
    siteVisit: visit,
  });
});
