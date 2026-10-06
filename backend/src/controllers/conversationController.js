import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import SiteVisit from '../models/SiteVisit.js';
import Quotation from '../models/Quotation.js';
import Agreement from '../models/Agreement.js';
import Milestone from '../models/Milestone.js';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { getIO } from '../services/socketService.js';

const toIdString = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
};

const safeEmit = (conversationId, recipientId, senderId, eventName, payload) => {
  try {
    const io = getIO();
    if (!io) return;
    const cId = toIdString(conversationId);
    const rId = toIdString(recipientId);
    const sId = toIdString(senderId);
    if (cId) io.to(`conversation:${cId}`).emit(eventName, payload);
    if (rId) io.to(`user:${rId}`).emit(eventName, payload);
    if (sId) io.to(`user:${sId}`).emit(eventName, payload);
  } catch (e) {
    console.warn('[Socket safeEmit warning]', e.message);
  }
};

export const getConversations = asyncHandler(async (req, res) => {
  const { projectId, recipientId } = req.query;
  const userOid = new mongoose.Types.ObjectId(req.user._id);
  const filter = {
    'participants.user': userOid,
  };

  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filter.project = new mongoose.Types.ObjectId(projectId);
  }
  if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
    filter['participants.user'] = { $all: [userOid, new mongoose.Types.ObjectId(recipientId)] };
  }

  const conversations = await Conversation.find(filter)
    .populate('participants.user', 'name avatarUrl role city email phone')
    .populate('project', 'title category stage status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    count: conversations.length,
    conversations,
  });
});

export const getConversationById = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, 'Invalid conversation ID.');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'name avatarUrl role city email phone')
    .populate('project', 'title category stage status')
    .populate('lastMessage');

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found.');
  }

  const isParticipant = conversation.participants.some(
    (p) => toIdString(p.user) === req.user._id.toString()
  );

  if (!isParticipant && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Unauthorized access to this conversation.');
  }

  res.json({
    success: true,
    conversation,
  });
});

export const findOrCreateConversation = asyncHandler(async (req, res) => {
  const { projectId, recipientId } = req.body;
  const userOid = new mongoose.Types.ObjectId(req.user._id);
  const recipientOid = recipientId && mongoose.Types.ObjectId.isValid(recipientId)
    ? new mongoose.Types.ObjectId(recipientId)
    : null;
  const projectOid = projectId && mongoose.Types.ObjectId.isValid(projectId)
    ? new mongoose.Types.ObjectId(projectId)
    : null;

  let conversation = null;

  if (projectOid) {
    conversation = await Conversation.findOne({
      project: projectOid,
      'participants.user': userOid,
    })
      .populate('participants.user', 'name avatarUrl role city email phone')
      .populate('project', 'title category stage status')
      .populate('lastMessage');
  }

  if (!conversation && recipientOid) {
    conversation = await Conversation.findOne({
      'participants.user': { $all: [userOid, recipientOid] },
    })
      .populate('participants.user', 'name avatarUrl role city email phone')
      .populate('project', 'title category stage status')
      .populate('lastMessage');
  }

  if (!conversation) {
    let actualRecipientId = recipientId;

    if (projectOid && !actualRecipientId) {
      const projObj = await Project.findById(projectOid);
      if (projObj) {
        if (projObj.client.toString() === req.user._id.toString()) {
          actualRecipientId = projObj.assignedWorker;
        } else {
          actualRecipientId = projObj.client;
        }
      }
    }

    if (actualRecipientId && mongoose.Types.ObjectId.isValid(actualRecipientId)) {
      const recipientUser = await User.findById(actualRecipientId);
      const recipientRole = recipientUser?.role || (req.user.role === 'CLIENT' ? 'WORKER' : 'CLIENT');

      const createdConv = await Conversation.create({
        ...(projectOid ? { project: projectOid } : {}),
        participants: [
          { user: userOid, role: req.user.role },
          { user: new mongoose.Types.ObjectId(actualRecipientId), role: recipientRole },
        ],
      });

      conversation = await Conversation.findById(createdConv._id)
        .populate('participants.user', 'name avatarUrl role city email phone')
        .populate('project', 'title category stage status');
    }
  }

  res.json({
    success: true,
    conversation,
  });
});

export const getMessagesByConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, 'Invalid conversation ID.');
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found.');
  }

  const isParticipant = conversation.participants.some(
    (p) => toIdString(p.user) === req.user._id.toString()
  );

  if (!isParticipant && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Unauthorized access to this conversation.');
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name avatarUrl role')
    .sort({ createdAt: 1 });

  // Mark unread messages as read
  await Message.updateMany(
    { conversation: conversationId, recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({
    success: true,
    count: messages.length,
    messages,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const {
    conversationId,
    projectId,
    recipientId,
    content,
    attachments,
    messageType = 'TEXT',
    locationData,
    quotationData,
    metadata,
  } = req.body;

  const userOid = new mongoose.Types.ObjectId(req.user._id);
  let conversation;

  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    conversation = await Conversation.findById(conversationId);
  } else if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
    const recipientOid = new mongoose.Types.ObjectId(recipientId);
    const projectOid = projectId && mongoose.Types.ObjectId.isValid(projectId)
      ? new mongoose.Types.ObjectId(projectId)
      : null;

    // Find existing direct conversation between these two users
    conversation = await Conversation.findOne({
      ...(projectOid ? { project: projectOid } : {}),
      'participants.user': { $all: [userOid, recipientOid] },
    });

    if (!conversation) {
      const recipientUser = await User.findById(recipientOid);
      const recipientRole = recipientUser?.role || (req.user.role === 'CLIENT' ? 'WORKER' : 'CLIENT');

      conversation = await Conversation.create({
        ...(projectOid ? { project: projectOid } : {}),
        participants: [
          { user: userOid, role: req.user.role },
          { user: recipientOid, role: recipientRole },
        ],
      });
    }
  }

  if (!conversation) {
    throw new ApiError(400, 'Invalid conversation request.');
  }

  const otherParticipant = conversation.participants.find(
    (p) => toIdString(p.user) !== req.user._id.toString()
  );

  const targetRecipientId = toIdString(recipientId) || (otherParticipant ? toIdString(otherParticipant.user) : null);

  if (!targetRecipientId) {
    throw new ApiError(400, 'Recipient required');
  }

  // Handle location sharing and site inspection request
  let linkedProject = conversation.project;
  if (messageType === 'LOCATION_SHARE' && locationData) {
    // Create or link a project if one does not exist yet
    if (!linkedProject) {
      const newProj = await Project.create({
        client: req.user.role === 'CLIENT' ? req.user._id : targetRecipientId,
        assignedWorker: req.user.role === 'WORKER' ? req.user._id : targetRecipientId,
        title: metadata?.projectTitle || 'Site Work & Renovation Project',
        description: locationData.notes || 'Client requested site inspection and work analysis.',
        category: metadata?.category || 'General Renovation',
        publicLocation: {
          city: locationData.city || 'Local Area',
          area: locationData.area || '',
        },
        exactAddress: {
          street: locationData.address || '',
          landmark: locationData.landmark || '',
          pincode: locationData.pincode || '',
          coordinates: locationData.coordinates || null,
        },
        locationSharedWithWorker: true,
        status: 'SITE_VISIT_PENDING',
        stage: 'SITE_VISIT',
      });
      linkedProject = newProj._id;
      conversation.project = newProj._id;
      await conversation.save();
    } else {
      await Project.findByIdAndUpdate(linkedProject, {
        exactAddress: {
          street: locationData.address || '',
          landmark: locationData.landmark || '',
          pincode: locationData.pincode || '',
          coordinates: locationData.coordinates || null,
        },
        locationSharedWithWorker: true,
        status: 'SITE_VISIT_PENDING',
        stage: 'SITE_VISIT',
      });
    }

    // Create SiteVisit entry
    await SiteVisit.create({
      project: linkedProject,
      client: req.user.role === 'CLIENT' ? req.user._id : targetRecipientId,
      worker: req.user.role === 'WORKER' ? req.user._id : targetRecipientId,
      requestedBy: req.user.role,
      visitDate: locationData.visitDate ? new Date(locationData.visitDate) : new Date(Date.now() + 86400000),
      notes: locationData.notes || 'Site visit requested with exact coordinates.',
      status: 'SCHEDULED',
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    project: linkedProject || conversation.project,
    sender: req.user._id,
    recipient: targetRecipientId,
    content: content || (messageType === 'LOCATION_SHARE' ? '📍 Shared site location & requested site inspection' : ''),
    attachments: attachments || [],
    messageType,
    locationData: locationData || null,
    quotationData: quotationData || null,
    metadata: metadata || null,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  await Notification.create({
    recipient: targetRecipientId,
    sender: req.user._id,
    type: messageType === 'LOCATION_SHARE' ? 'SITE_VISIT_REQUEST' : 'MESSAGE',
    title:
      messageType === 'LOCATION_SHARE'
        ? `📍 Site Location shared by ${req.user.name}`
        : messageType === 'QUOTATION'
        ? `📋 New Quotation from ${req.user.name}`
        : `New message from ${req.user.name}`,
    message: content ? (content.length > 60 ? `${content.substring(0, 60)}...` : content) : 'Sent project details',
    link: `/client/messages?conversationId=${conversation._id}`,
  });

  const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatarUrl role');

  safeEmit(conversation._id, targetRecipientId, req.user._id, 'new_message', populatedMessage);
  safeEmit(conversation._id, targetRecipientId, req.user._id, 'conversation_updated', {
    conversationId: conversation._id,
    lastMessage: populatedMessage,
  });

  res.status(201).json({
    success: true,
    message: populatedMessage,
    conversationId: conversation._id,
  });
});

export const handleMessageAction = asyncHandler(async (req, res) => {
  const { messageId, action, payload } = req.body;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found.');
  }

  if (action === 'ACCEPT_SITE_VISIT') {
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: { 'locationData.status': 'ACCEPTED' } },
      { new: true }
    ).populate('sender', 'name avatarUrl role');

    if (conversation.project) {
      await Project.findByIdAndUpdate(conversation.project, {
        status: 'SITE_VISIT_PENDING',
        stage: 'SITE_VISIT',
        locationSharedWithWorker: true,
      });
      await SiteVisit.findOneAndUpdate(
        { project: conversation.project },
        { status: 'APPROVED' },
        { sort: { createdAt: -1 } }
      );
    }

    const otherParticipant = conversation.participants.find(
      (p) => toIdString(p.user) !== req.user._id.toString()
    );
    const targetRecipientId = toIdString(otherParticipant ? otherParticipant.user : message.sender);

    const visitDateStr = message.locationData?.visitDate
      ? new Date(message.locationData.visitDate).toLocaleDateString()
      : 'the scheduled date';
    const visitTimeStr = message.locationData?.visitTime || '11:00 AM';

    const replyMsg = await Message.create({
      conversation: conversation._id,
      project: conversation.project,
      sender: req.user._id,
      recipient: targetRecipientId,
      content: `✅ I have accepted your site visit request! I will visit the site on ${visitDateStr} at ${visitTimeStr} to inspect and analyze the work to be done.`,
      messageType: 'TEXT',
    });

    conversation.lastMessage = replyMsg._id;
    await conversation.save();

  const populatedReply = await Message.findById(replyMsg._id).populate('sender', 'name avatarUrl role');

    safeEmit(conversation._id, targetRecipientId, req.user._id, 'message_updated', updatedMessage);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'new_message', populatedReply);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'conversation_updated', {
      conversationId: conversation._id,
      lastMessage: populatedReply,
    });

    return res.json({
      success: true,
      message: 'Site visit accepted',
      reply: populatedReply,
      updatedMessage: updatedMessage || message,
    });
  }

  if (action === 'COMPLETE_SITE_ANALYSIS') {
    const { notes, workScope } = payload || {};

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          'locationData.status': 'VISITED',
          'locationData.siteAnalysis': {
            inspectedAt: new Date(),
            notes: notes || 'Site inspection completed. Work analysis documented.',
            workScope: workScope || 'Complete on-site measurement and assessment done.',
          },
        },
      },
      { new: true }
    ).populate('sender', 'name avatarUrl role');

    if (conversation.project) {
      await Project.findByIdAndUpdate(conversation.project, {
        status: 'QUOTATION_PENDING',
        stage: 'SITE_VISIT',
      });
      await SiteVisit.findOneAndUpdate(
        { project: conversation.project },
        { status: 'COMPLETED', notes: notes || '' },
        { sort: { createdAt: -1 } }
      );
    }

    const otherParticipant = conversation.participants.find(
      (p) => toIdString(p.user) !== req.user._id.toString()
    );
    const targetRecipientId = toIdString(otherParticipant ? otherParticipant.user : message.sender);

    const replyMsg = await Message.create({
      conversation: conversation._id,
      project: conversation.project,
      sender: req.user._id,
      recipient: targetRecipientId,
      content: `🔍 On-Site Inspection & Work Analysis Complete!\n\nSummary: ${notes || 'Site inspected thoroughly.'}\n\nScope of Work: ${workScope || 'Measurements and specifications recorded. Ready to finalize quotation.'}`,
      messageType: 'TEXT',
    });

    conversation.lastMessage = replyMsg._id;
    await conversation.save();

    const populatedReply = await Message.findById(replyMsg._id).populate('sender', 'name avatarUrl role');

    safeEmit(conversation._id, targetRecipientId, req.user._id, 'message_updated', updatedMessage);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'new_message', populatedReply);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'conversation_updated', {
      conversationId: conversation._id,
      lastMessage: populatedReply,
    });

    return res.json({
      success: true,
      message: 'Site visit marked as completed and work analyzed',
      reply: populatedReply,
      updatedMessage: updatedMessage || message,
    });
  }

  if (action === 'SUBMIT_QUOTATION') {
    const { items, timeline, notes } = payload || {};

    const processedItems = (items || [{ title: 'Execution of Work', amount: 20000 }]).map((it) => ({
      title: it.title,
      amount: Number(it.amount) || 0,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'unit',
      labourCost: Number(it.labourCost) || 0,
      materialCost: Number(it.materialCost) || 0,
      totalPrice: Number(it.amount) || 0,
    }));

    const subtotal = processedItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    // Platform secure maintenance & escrow charge (5%)
    const platformFee = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + platformFee;
    const workerPayoutAmount = subtotal;

    // Fetch worker profile to attach registered payout details (Bank / UPI)
    const workerProfile = await WorkerProfile.findOne({ user: req.user._id });
    const payout = workerProfile?.payoutInfo || {};
    const workerPayoutInfo = {
      upiId: payout.upiId || 'Will provide before milestone release',
      bankName: payout.bankName || (payout.accountNumber ? 'Direct Bank Transfer' : 'Direct Account'),
      accountMasked: payout.accountNumber ? `•••• ${payout.accountNumber.slice(-4)}` : '',
    };

    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;

    let projId = conversation.project;
    if (!projId) {
      const otherUser = conversation.participants.find((p) => p.user.toString() !== req.user._id.toString());
      const newProj = await Project.create({
        client: req.user.role === 'CLIENT' ? req.user._id : otherUser.user,
        assignedWorker: req.user.role === 'WORKER' ? req.user._id : otherUser.user,
        title: 'Project Renovation & Execution',
        description: notes || 'Quotation generated following physical on-site inspection.',
        category: 'Interior & Renovation',
        publicLocation: { city: 'Local Area' },
        status: 'QUOTATION_PENDING',
        stage: 'APPROVAL',
        estimatedBudget: grandTotal,
      });
      projId = newProj._id;
      conversation.project = newProj._id;
      await conversation.save();
    }

    const quote = await Quotation.create({
      project: projId,
      worker: req.user._id,
      client: message.sender,
      quoteNumber,
      items: processedItems,
      subtotal,
      platformFee,
      workerPayoutAmount,
      grandTotal,
      status: 'SENT',
      notes: notes || '',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const otherParticipant = conversation.participants.find(
      (p) => toIdString(p.user) !== req.user._id.toString()
    );
    const targetRecipientId = toIdString(otherParticipant ? otherParticipant.user : message.sender);

    const quoteMsg = await Message.create({
      conversation: conversation._id,
      project: projId,
      sender: req.user._id,
      recipient: targetRecipientId,
      content: `📋 Itemized Quotation: ${quoteNumber} | Subtotal: ₹${subtotal.toLocaleString()} + Platform Security Fee (5%): ₹${platformFee.toLocaleString()} | Total Payable: ₹${grandTotal.toLocaleString()}`,
      messageType: 'QUOTATION',
      quotationData: {
        quoteNumber,
        subtotal,
        platformFee,
        workerPayoutAmount,
        totalAmount: grandTotal,
        workerPayoutInfo,
        items: processedItems.map((i) => ({ title: i.title, amount: i.amount })),
        timeline: timeline || '7 - 10 Working Days',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
      metadata: { quotationId: quote._id },
    });

    conversation.lastMessage = quoteMsg._id;
    await conversation.save();

    const populatedReply = await Message.findById(quoteMsg._id).populate('sender', 'name avatarUrl role');

    safeEmit(conversation._id, targetRecipientId, req.user._id, 'new_message', populatedReply);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'conversation_updated', {
      conversationId: conversation._id,
      lastMessage: populatedReply,
    });

    return res.json({
      success: true,
      message: 'Transparent quotation submitted to chat',
      reply: populatedReply,
    });
  }

  if (action === 'FINALIZE_DEAL') {
    const { paymentMethod = 'UPI' } = payload || {};

    const projId = conversation.project || message.project;
    const totalAmount = message.quotationData?.totalAmount || 25000;
    const platformFee = message.quotationData?.platformFee || Math.round(totalAmount * 0.05);
    const workerPayoutAmount = message.quotationData?.workerPayoutAmount || totalAmount - platformFee;

    // Update quote message in DB
    const updatedQuoteMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          'quotationData.status': 'ACCEPTED',
          'quotationData.paymentStatus': 'ESCROW_LOCKED',
          'quotationData.acceptedAt': new Date(),
        },
      },
      { new: true }
    );

    // Create official Payment record (In-App Payment Only)
    const paymentNumber = `PAY-ESCRW-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const txnId = `TXN_${paymentMethod.toUpperCase()}_${Date.now()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      project: projId,
      client: req.user._id,
      worker: message.sender,
      items: [
        { description: 'Contract Execution & Materials', amount: workerPayoutAmount },
        { description: 'Platform Secure Maintenance & Escrow Protection Charge (5%)', amount: platformFee },
      ],
      subtotal: workerPayoutAmount,
      tax: platformFee,
      totalAmount,
      status: 'PAID',
      issueDate: new Date(),
    });

    await Payment.create({
      paymentNumber,
      project: projId,
      invoice: invoice._id,
      client: req.user._id,
      worker: message.sender,
      amount: totalAmount,
      currency: 'INR',
      provider: paymentMethod === 'UPI' ? 'RAZORPAY_UPI' : 'IN_APP_GATEWAY',
      providerTransactionId: txnId,
      status: 'SUCCESSFUL',
      paidAt: new Date(),
    });

    if (projId) {
      await Project.findByIdAndUpdate(projId, {
        status: 'IN_PROGRESS',
        stage: 'EXECUTION',
      });

      if (message.metadata?.quotationId) {
        await Quotation.findByIdAndUpdate(message.metadata.quotationId, {
          status: 'ACCEPTED',
        });
      }

      let agreement = await Agreement.findOne({ project: projId });
      if (!agreement) {
        agreement = await Agreement.create({
          project: projId,
          quotation: message.metadata?.quotationId || null,
          client: req.user._id,
          worker: message.sender,
          scopeOfWork: 'Complete project execution per approved on-site analysis & quotation.',
          totalAmount,
          status: 'ACTIVE',
          signedByClientAt: new Date(),
          signedByWorkerAt: new Date(),
        });
      } else {
        agreement.status = 'ACTIVE';
        agreement.signedByClientAt = new Date();
        agreement.signedByWorkerAt = new Date();
        await agreement.save();
      }

      // Generate 3 standard project milestones
      const existingMilestones = await Milestone.countDocuments({ project: projId });
      if (existingMilestones === 0) {
        const milestoneTemplates = [
          { title: 'Project Mobilization & Site Setup (30%)', pct: 0.30, desc: 'Initial raw materials delivery & site preparation' },
          { title: 'Mid-Stage Civil/Carpentry Execution (40%)', pct: 0.40, desc: 'Core installation & construction works' },
          { title: 'Final Finishing & Handover Inspection (30%)', pct: 0.30, desc: 'Final touch-ups, cleanup, and walkthrough inspection' },
        ];
        for (const t of milestoneTemplates) {
          await Milestone.create({
            project: projId,
            agreement: agreement._id,
            title: t.title,
            description: t.desc,
            amount: Math.round(workerPayoutAmount * t.pct),
            status: 'PENDING',
            paymentStatus: 'UNPAID',
          });
        }
      }
    }

    const otherParticipant = conversation.participants.find(
      (p) => toIdString(p.user) !== req.user._id.toString()
    );
    const targetRecipientId = toIdString(otherParticipant ? otherParticipant.user : message.sender);

    // Post finalized deal celebratory message with in-app payment details
    const replyMsg = await Message.create({
      conversation: conversation._id,
      project: projId,
      sender: req.user._id,
      recipient: targetRecipientId,
      content: `🎉 DEAL FINALIZED & IN-APP ESCROW PAYMENT SUCCESSFUL!\n\n• Total Paid by Client: INR ${totalAmount.toLocaleString()} (Paid via ${paymentMethod})\n• Includes Platform Secure Maintenance & Escrow Charge (5%): INR ${platformFee.toLocaleString()}\n• Worker Payout of INR ${workerPayoutAmount.toLocaleString()} is locked in platform Escrow.\n• Payout will release to worker's Bank / UPI (${message.quotationData?.workerPayoutInfo?.upiId || 'Registered Account'}) upon milestone approval.\n• Transaction ID: ${txnId}`,
      messageType: 'DEAL_FINALIZED',
      metadata: {
        dealAmount: totalAmount,
        workerPayoutAmount,
        platformFee,
        paymentMethod,
        txnId,
        finalizedAt: new Date(),
        projectId: projId,
      },
    });

    conversation.lastMessage = replyMsg._id;
    await conversation.save();

    const populatedReply = await Message.findById(replyMsg._id).populate('sender', 'name avatarUrl role');

    safeEmit(conversation._id, targetRecipientId, req.user._id, 'message_updated', updatedQuoteMessage);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'new_message', populatedReply);
    safeEmit(conversation._id, targetRecipientId, req.user._id, 'conversation_updated', {
      conversationId: conversation._id,
      lastMessage: populatedReply,
    });

    return res.json({
      success: true,
      message: 'Deal finalized and in-app escrow payment completed successfully',
      reply: populatedReply,
      updatedMessage: updatedQuoteMessage || message,
    });
  }

  res.status(400).json({ success: false, message: 'Invalid action' });
});
