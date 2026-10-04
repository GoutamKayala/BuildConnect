import Quotation from '../models/Quotation.js';
import QuotationAudit from '../models/QuotationAudit.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const createQuotation = asyncHandler(async (req, res) => {
  const { projectId, items, taxAmount = 0, discountAmount = 0, otherCharges = 0, validUntil, notes, terms } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  if (req.user.role !== 'WORKER') {
    throw new ApiError(403, 'Only workers can create quotations.');
  }

  if (!items || !items.length) {
    throw new ApiError(400, 'Quotation must include at least one item.');
  }

  let subtotal = 0;
  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const labour = Number(item.labourCost) || 0;
    const material = Number(item.materialCost) || 0;
    const itemTotal = (qty * unitPrice) + labour + material;
    subtotal += itemTotal;
    return {
      title: item.title,
      quantity: qty,
      unit: item.unit || 'unit',
      unitPrice,
      labourCost: labour,
      materialCost: material,
      totalPrice: itemTotal,
    };
  });

  const grandTotal = subtotal + Number(taxAmount) + Number(otherCharges) - Number(discountAmount);
  const quoteNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const quote = await Quotation.create({
    project: projectId,
    worker: req.user._id,
    client: project.client,
    quoteNumber,
    version: 1,
    status: 'SENT',
    items: processedItems,
    subtotal,
    taxAmount: Number(taxAmount),
    discountAmount: Number(discountAmount),
    otherCharges: Number(otherCharges),
    grandTotal,
    validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    notes: notes || '',
    terms: terms || 'Standard payment terms apply.',
  });

  project.status = 'QUOTATION_PENDING';
  project.stage = 'APPROVAL';
  await project.save();

  await QuotationAudit.create({
    quotation: quote._id,
    changedBy: req.user._id,
    action: 'CREATE_QUOTATION',
    newStatus: 'SENT',
    snapshotData: quote.toObject(),
    changeDescription: 'Initial quotation created and sent to client',
  });

  await Notification.create({
    recipient: project.client,
    sender: req.user._id,
    type: 'QUOTATION_NEW',
    title: 'New Quotation Received',
    message: `Worker sent quote ${quoteNumber} for INR ${grandTotal.toLocaleString()}`,
    link: `/client/projects/${projectId}`,
  });

  await logAudit({
    actorId: req.user._id,
    action: 'CREATE_QUOTATION',
    resource: 'Quotation',
    resourceId: quote._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Quotation generated and sent to client',
    quotation: quote,
  });
});

export const getProjectQuotations = asyncHandler(async (req, res) => {
  const quotes = await Quotation.find({ project: req.params.projectId })
    .populate('worker', 'name avatarUrl phone')
    .populate('client', 'name avatarUrl phone')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: quotes.length,
    quotations: quotes,
  });
});

export const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { status, clientNotes } = req.body;
  const quote = await Quotation.findById(req.params.quoteId);

  if (!quote) {
    throw new ApiError(404, 'Quotation not found.');
  }

  const prevStatus = quote.status;
  quote.status = status;
  await quote.save();

  const project = await Project.findById(quote.project);
  if (status === 'ACCEPTED') {
    project.status = 'AGREEMENT_PENDING';
    await project.save();
  }

  await QuotationAudit.create({
    quotation: quote._id,
    changedBy: req.user._id,
    action: `STATUS_CHANGE_${status}`,
    previousStatus: prevStatus,
    newStatus: status,
    changeDescription: clientNotes || `Quotation status changed to ${status}`,
  });

  const notifyUser = req.user._id.toString() === quote.client.toString() ? quote.worker : quote.client;
  await Notification.create({
    recipient: notifyUser,
    sender: req.user._id,
    type: `QUOTATION_${status}`,
    title: `Quotation ${status}`,
    message: `Quote ${quote.quoteNumber} was ${status.toLowerCase()}`,
    link: `/projects/${quote.project}`,
  });

  res.json({
    success: true,
    message: `Quotation ${status}`,
    quotation: quote,
  });
});
