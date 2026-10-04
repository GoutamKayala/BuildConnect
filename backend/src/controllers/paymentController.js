import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { logAudit } from '../utils/auditLogger.js';

export const processMilestonePayment = asyncHandler(async (req, res) => {
  const { milestoneId, provider = 'SIMULATED' } = req.body;

  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found.');
  }

  const project = await Project.findById(milestone.project);
  if (!project) {
    throw new ApiError(404, 'Associated project not found.');
  }

  if (project.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only project client can process milestone payment.');
  }

  const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const providerTransactionId = `TXN_${provider}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Create Invoice
  const invoice = await Invoice.create({
    invoiceNumber,
    project: project._id,
    milestone: milestone._id,
    client: req.user._id,
    worker: project.assignedWorker,
    items: [
      {
        description: `Milestone Payment: ${milestone.title}`,
        amount: milestone.amount,
      },
    ],
    subtotal: milestone.amount,
    tax: Math.round(milestone.amount * 0.18), // 18% GST standard calculation
    discount: 0,
    totalAmount: Math.round(milestone.amount * 1.18),
    status: 'PAID',
    issueDate: new Date(),
  });

  // Create Payment Record
  const payment = await Payment.create({
    paymentNumber,
    project: project._id,
    milestone: milestone._id,
    invoice: invoice._id,
    client: req.user._id,
    worker: project.assignedWorker,
    amount: invoice.totalAmount,
    currency: 'INR',
    provider,
    providerTransactionId,
    status: 'SUCCESSFUL',
    paidAt: new Date(),
  });

  // Update Milestone
  milestone.paymentStatus = 'PAID';
  milestone.status = 'COMPLETED';
  milestone.completionPercentage = 100;
  await milestone.save();

  // Check if all milestones completed to mark project complete
  const allMilestones = await Milestone.find({ project: project._id });
  const allPaid = allMilestones.every((m) => m.paymentStatus === 'PAID');
  if (allPaid && allMilestones.length > 0) {
    project.status = 'COMPLETED';
    project.stage = 'FINAL_PAYMENT';
    await project.save();
  }

  if (project.assignedWorker) {
    await Notification.create({
      recipient: project.assignedWorker,
      sender: req.user._id,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received!',
      message: `Received payment of INR ${invoice.totalAmount.toLocaleString()} for milestone "${milestone.title}"`,
      link: `/worker/payments`,
    });
  }

  await logAudit({
    actorId: req.user._id,
    action: 'PROCESS_PAYMENT',
    resource: 'Payment',
    resourceId: payment._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Payment completed successfully',
    payment,
    invoice,
  });
});

export const getInvoices = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'CLIENT') filter.client = req.user._id;
  if (req.user.role === 'WORKER') filter.worker = req.user._id;

  const invoices = await Invoice.find(filter)
    .populate('project', 'title category')
    .populate('client', 'name email')
    .populate('worker', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: invoices.length,
    invoices,
  });
});

export const downloadInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client', 'name email')
    .populate('worker', 'name email')
    .populate('project', 'title');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found.');
  }

  const isClient = invoice.client._id.toString() === req.user._id.toString();
  const isWorker = invoice.worker._id.toString() === req.user._id.toString();
  if (!isClient && !isWorker && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Unauthorized access to invoice PDF.');
  }

  generateInvoicePDF(invoice, res);
});
