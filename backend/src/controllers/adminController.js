import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import VerificationDocument from '../models/VerificationDocument.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAdminMetrics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const clientsCount = await User.countDocuments({ role: 'CLIENT' });
  const workersCount = await User.countDocuments({ role: 'WORKER' });
  const verifiedWorkersCount = await WorkerProfile.countDocuments({ verificationStatus: 'VERIFIED' });
  const pendingVerificationsCount = await VerificationDocument.countDocuments({ status: 'PENDING' });
  const activeProjectsCount = await Project.countDocuments({ status: { $in: ['IN_PROGRESS', 'QUOTATION_PENDING', 'SITE_VISIT_PENDING'] } });
  
  const paymentStats = await Payment.aggregate([
    { $match: { status: 'SUCCESSFUL' } },
    { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
  ]);

  const totalVolume = paymentStats.length > 0 ? paymentStats[0].totalVolume : 0;

  res.json({
    success: true,
    metrics: {
      totalUsers,
      clientsCount,
      workersCount,
      verifiedWorkersCount,
      pendingVerificationsCount,
      activeProjectsCount,
      totalVolume,
    },
  });
});

export const getUsersAdmin = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.status = status;
  await user.save();

  await logAudit({
    actorId: req.user._id,
    action: `ADMIN_USER_${status}`,
    resource: 'User',
    resourceId: user._id,
    req,
  });

  res.json({
    success: true,
    message: `User status changed to ${status}`,
    user,
  });
});

export const getVerificationsAdmin = asyncHandler(async (req, res) => {
  const docs = await VerificationDocument.find()
    .populate('worker', 'name email avatarUrl city phone')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    documents: docs,
  });
});

export const reviewVerificationAdmin = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body; // 'VERIFIED' or 'REJECTED'
  const doc = await VerificationDocument.findById(req.params.id);

  if (!doc) {
    throw new ApiError(404, 'Verification document not found.');
  }

  doc.status = status;
  doc.reviewedBy = req.user._id;
  doc.reviewNotes = reviewNotes || '';
  doc.reviewedAt = new Date();
  await doc.save();

  // Update WorkerProfile verification status
  const workerProfile = await WorkerProfile.findOne({ user: doc.worker });
  if (workerProfile) {
    workerProfile.verificationStatus = status;
    if (status === 'REJECTED') {
      workerProfile.verificationRejectionReason = reviewNotes || 'Document verification failed requirements.';
    }
    await workerProfile.save();
  }

  if (status === 'VERIFIED') {
    await User.findByIdAndUpdate(doc.worker, { isVerified: true });
  }

  await Notification.create({
    recipient: doc.worker,
    sender: req.user._id,
    type: 'VERIFICATION_STATUS',
    title: `Identity Verification ${status}`,
    message: status === 'VERIFIED'
      ? 'Congratulations! Your professional profile has been verified.'
      : `Verification rejected: ${reviewNotes || 'Please check requirements and re-upload.'}`,
    link: `/worker/verification`,
  });

  await logAudit({
    actorId: req.user._id,
    action: `ADMIN_REVIEW_VERIFICATION_${status}`,
    resource: 'VerificationDocument',
    resourceId: doc._id,
    req,
  });

  res.json({
    success: true,
    message: `Verification marked as ${status}`,
    document: doc,
  });
});

export const getAuditLogsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action } = req.query;
  const filter = {};
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const logs = await AuditLog.find(filter)
    .populate('actor', 'name email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await AuditLog.countDocuments(filter);

  res.json({
    success: true,
    logs,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});
