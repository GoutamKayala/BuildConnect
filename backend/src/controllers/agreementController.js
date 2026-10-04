import Agreement from '../models/Agreement.js';
import Quotation from '../models/Quotation.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const createAgreement = asyncHandler(async (req, res) => {
  const { quotationId, scopeOfWork, termsAndConditions } = req.body;

  const quote = await Quotation.findById(quotationId);
  if (!quote) {
    throw new ApiError(404, 'Quotation not found.');
  }

  const existing = await Agreement.findOne({ quotation: quotationId });
  if (existing) {
    return res.json({ success: true, agreement: existing });
  }

  const agreement = await Agreement.create({
    project: quote.project,
    quotation: quote._id,
    client: quote.client,
    worker: quote.worker,
    scopeOfWork: scopeOfWork || `Execution of ${quote.items.map((i) => i.title).join(', ')}`,
    totalAmount: quote.grandTotal,
    termsAndConditions: termsAndConditions || quote.terms,
    status: 'PENDING_SIGNATURES',
  });

  res.status(201).json({
    success: true,
    message: 'Project agreement created',
    agreement,
  });
});

export const signAgreement = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findById(req.params.id);
  if (!agreement) {
    throw new ApiError(404, 'Agreement not found.');
  }

  const isClient = agreement.client.toString() === req.user._id.toString();
  const isWorker = agreement.worker.toString() === req.user._id.toString();

  if (!isClient && !isWorker) {
    throw new ApiError(403, 'Unauthorized to sign this agreement.');
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (isClient) {
    agreement.signedByClientAt = new Date();
    agreement.clientAudit = { ip, userAgent, signedAt: new Date() };
  } else if (isWorker) {
    agreement.signedByWorkerAt = new Date();
    agreement.workerAudit = { ip, userAgent, signedAt: new Date() };
  }

  if (agreement.signedByClientAt && agreement.signedByWorkerAt) {
    agreement.status = 'ACTIVE';

    const project = await Project.findById(agreement.project);
    project.status = 'IN_PROGRESS';
    project.stage = 'EXECUTION';
    await project.save();

    // Create 5 standard milestone steps if none exist yet
    const existingMilestones = await Milestone.countDocuments({ project: agreement.project });
    if (existingMilestones === 0) {
      const total = agreement.totalAmount;
      const milestoneTemplates = [
        { title: 'Booking Advance', pct: 0.10, desc: 'Initial project setup & planning' },
        { title: 'Design & Layout Approval', pct: 0.20, desc: 'Finalizing 3D renders & material selection' },
        { title: 'Material Procurement', pct: 0.30, desc: 'Procurement of raw materials on site' },
        { title: 'Execution & Carpentry/Civil Work', pct: 0.30, desc: 'On-site execution & installation' },
        { title: 'Final Handover & Inspection', pct: 0.10, desc: 'Final walkthrough & touch-ups' },
      ];

      for (const t of milestoneTemplates) {
        await Milestone.create({
          project: agreement.project,
          agreement: agreement._id,
          title: t.title,
          description: t.desc,
          amount: Math.round(total * t.pct),
          status: 'PENDING',
          paymentStatus: 'UNPAID',
        });
      }
    }
  }

  await agreement.save();

  await logAudit({
    actorId: req.user._id,
    action: 'SIGN_AGREEMENT',
    resource: 'Agreement',
    resourceId: agreement._id,
    req,
  });

  res.json({
    success: true,
    message: 'Agreement signed successfully',
    agreement,
  });
});

export const getAgreementByProject = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findOne({ project: req.params.projectId })
    .populate('client', 'name email avatarUrl')
    .populate('worker', 'name email avatarUrl');

  res.json({
    success: true,
    agreement,
  });
});
