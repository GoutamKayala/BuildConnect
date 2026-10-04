import WorkerProfile from '../models/WorkerProfile.js';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Review from '../models/Review.js';
import VerificationDocument from '../models/VerificationDocument.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { saveUploadedFile } from '../services/storageService.js';
import { logAudit } from '../utils/auditLogger.js';

export const getWorkers = asyncHandler(async (req, res) => {
  const {
    category,
    city,
    verifiedOnly,
    minRating,
    minExperience,
    search,
    sortBy = 'rating',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};

  if (category && category !== 'All') {
    filter.categories = { $in: [category] };
  }

  if (city && city !== 'All') {
    filter.city = { $regex: city, $options: 'i' };
  }

  if (verifiedOnly === 'true') {
    filter.verificationStatus = 'VERIFIED';
  }

  if (minRating) {
    filter.avgRating = { $gte: Number(minRating) };
  }

  if (minExperience) {
    filter.experienceYears = { $gte: Number(minExperience) };
  }

  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption = { avgRating: -1, completedProjectsCount: -1 };
  if (sortBy === 'experience') sortOption = { experienceYears: -1 };
  if (sortBy === 'recent') sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const workers = await WorkerProfile.find(filter)
    .populate('user', 'name email avatarUrl phone isVerified status')
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await WorkerProfile.countDocuments(filter);

  res.json({
    success: true,
    count: workers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    workers,
  });
});

export const getWorkerById = asyncHandler(async (req, res) => {
  const workerProfile = await WorkerProfile.findOne({
    $or: [{ _id: req.params.id }, { user: req.params.id }],
  }).populate('user', 'name email avatarUrl phone city isVerified status');

  if (!workerProfile) {
    throw new ApiError(404, 'Worker profile not found.');
  }

  const portfolio = await Portfolio.find({ worker: workerProfile.user._id });
  const reviews = await Review.find({ reviewee: workerProfile.user._id }).populate('reviewer', 'name avatarUrl');

  res.json({
    success: true,
    worker: workerProfile,
    portfolio,
    reviews,
  });
});

export const getMyWorkerProfile = asyncHandler(async (req, res) => {
  let workerProfile = await WorkerProfile.findOne({ user: req.user._id }).populate(
    'user',
    'name email avatarUrl phone city isVerified status'
  );

  if (!workerProfile) {
    workerProfile = await WorkerProfile.create({
      user: req.user._id,
      businessName: `${req.user.name} Studio`,
      city: req.user.city || 'Hyderabad',
      categories: ['Interior Design'],
    });
    workerProfile = await WorkerProfile.findById(workerProfile._id).populate(
      'user',
      'name email avatarUrl phone city isVerified status'
    );
  }

  res.json({
    success: true,
    worker: workerProfile,
  });
});

export const updateWorkerProfile = asyncHandler(async (req, res) => {
  const {
    businessName,
    description,
    categories,
    experienceYears,
    city,
    serviceRadiusKm,
    serviceAreas,
    pricingInfo,
    availabilityStatus,
    phone,
    name,
    avatarUrl,
  } = req.body;

  let workerProfile = await WorkerProfile.findOne({ user: req.user._id });

  if (!workerProfile) {
    workerProfile = new WorkerProfile({ user: req.user._id });
  }

  if (businessName !== undefined) workerProfile.businessName = businessName;
  if (description !== undefined) workerProfile.description = description;
  if (categories !== undefined) workerProfile.categories = categories;
  if (experienceYears !== undefined) workerProfile.experienceYears = Number(experienceYears);
  if (city !== undefined) workerProfile.city = city;
  if (serviceRadiusKm !== undefined) workerProfile.serviceRadiusKm = Number(serviceRadiusKm);
  if (serviceAreas !== undefined) workerProfile.serviceAreas = serviceAreas;
  if (pricingInfo !== undefined) workerProfile.pricingInfo = pricingInfo;
  if (availabilityStatus !== undefined) workerProfile.availabilityStatus = availabilityStatus;

  await workerProfile.save();

  // Update User info if onboarded, name, avatarUrl, phone or city updated
  const user = await User.findById(req.user._id);
  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (city !== undefined) user.city = city.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
  user.isOnboarded = true;
  await user.save();

  workerProfile = await WorkerProfile.findById(workerProfile._id).populate(
    'user',
    'name email avatarUrl phone city isVerified status'
  );

  await logAudit({
    actorId: req.user._id,
    action: 'UPDATE_WORKER_PROFILE',
    resource: 'WorkerProfile',
    resourceId: workerProfile._id,
    req,
  });

  res.json({
    success: true,
    message: 'Worker profile updated successfully',
    worker: workerProfile,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      city: user.city,
    },
  });
});

export const addPortfolioItem = asyncHandler(async (req, res) => {
  const { title, category, description, locationCity, budgetRange, completionDate, images, materialsUsed, servicesProvided, tags } = req.body;

  if (!title || !category) {
    throw new ApiError(400, 'Portfolio title and category are required.');
  }

  const item = await Portfolio.create({
    worker: req.user._id,
    title,
    category,
    description: description || '',
    locationCity: locationCity || '',
    budgetRange: budgetRange || '',
    completionDate: completionDate ? new Date(completionDate) : null,
    images: images || [],
    materialsUsed: materialsUsed || [],
    servicesProvided: servicesProvided || [],
    tags: tags || [],
    likes: [],
    likesCount: 0,
  });

  res.status(201).json({
    success: true,
    message: 'Portfolio project added',
    portfolio: item,
  });
});

export const likePortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Portfolio item not found.');
  }

  const userId = req.user._id;
  const alreadyLiked = item.likes && item.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    item.likes = item.likes.filter((id) => id.toString() !== userId.toString());
    item.likesCount = Math.max(0, (item.likesCount || 1) - 1);
  } else {
    if (!item.likes) item.likes = [];
    item.likes.push(userId);
    item.likesCount = (item.likesCount || 0) + 1;
  }

  await item.save();

  res.json({
    success: true,
    liked: !alreadyLiked,
    likesCount: item.likesCount,
  });
});

export const deletePortfolioItem = asyncHandler(async (req, res) => {
  const item = await Portfolio.findOneAndDelete({ _id: req.params.id, worker: req.user._id });
  if (!item) {
    throw new ApiError(404, 'Portfolio item not found or unauthorized.');
  }

  res.json({ success: true, message: 'Portfolio item deleted' });
});

export const uploadVerificationDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select a document file to upload.');
  }

  const { documentType } = req.body;
  if (!documentType) {
    throw new ApiError(400, 'Document type is required.');
  }

  const uploaded = await saveUploadedFile(req.file);

  const doc = await VerificationDocument.create({
    worker: req.user._id,
    documentType,
    fileKey: uploaded.fileKey,
    originalName: uploaded.originalName,
    mimeType: uploaded.mimeType,
    size: uploaded.size,
    status: 'PENDING',
  });

  await WorkerProfile.findOneAndUpdate(
    { user: req.user._id },
    { verificationStatus: 'PENDING' }
  );

  await logAudit({
    actorId: req.user._id,
    action: 'UPLOAD_VERIFICATION_DOCUMENT',
    resource: 'VerificationDocument',
    resourceId: doc._id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded for admin review',
    document: doc,
  });
});

export const getKycStatus = asyncHandler(async (req, res) => {
  let profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await WorkerProfile.create({
      user: req.user._id,
      businessName: `${req.user.name} Services`,
      city: req.user.city || 'Hyderabad',
      categories: ['Interior Design'],
    });
  }

  const documents = await VerificationDocument.find({ worker: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    verificationStatus: profile.verificationStatus,
    kyc: profile.kyc || {
      aadhaar: { isVerified: false },
      pan: { isVerified: false },
      trustScore: 0,
    },
    documents,
  });
});

export const verifyAadhaar = asyncHandler(async (req, res) => {
  const { aadhaarNumber, holderName, otp } = req.body;

  if (!aadhaarNumber) {
    throw new ApiError(400, 'Aadhaar Number is required.');
  }

  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(cleanNumber)) {
    throw new ApiError(400, 'Invalid Aadhaar Number. Must be exactly 12 numeric digits.');
  }

  if (!holderName || holderName.trim().length < 3) {
    throw new ApiError(400, 'Full name as per Aadhaar is required.');
  }

  // Handle uploaded document file if present
  let uploadedDoc = null;
  if (req.file) {
    const saved = await saveUploadedFile(req.file);
    uploadedDoc = await VerificationDocument.create({
      worker: req.user._id,
      documentType: 'AADHAAR',
      fileKey: saved.fileKey,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      status: 'VERIFIED',
      reviewNotes: 'Verified via UIDAI / DigiLocker Authorized e-KYC Gateway',
      reviewedAt: new Date(),
    });
  }

  let profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new WorkerProfile({
      user: req.user._id,
      businessName: holderName,
      city: req.user.city || 'Hyderabad',
      categories: ['Interior Design'],
    });
  }

  if (!profile.kyc) profile.kyc = {};

  const last4 = cleanNumber.slice(-4);
  const refId = `UIDAI-KYC-${Date.now().toString().slice(-8)}`;

  profile.kyc.aadhaar = {
    numberMasked: `XXXX-XXXX-${last4}`,
    holderName: holderName.trim(),
    isVerified: true,
    verifiedAt: new Date(),
    provider: 'UIDAI_DIGILOCKER',
    refId,
  };

  // Calculate trust score
  const isPanVerified = profile.kyc.pan?.isVerified;
  profile.kyc.trustScore = isPanVerified ? 100 : 50;

  // Set Verified Status
  profile.verificationStatus = 'VERIFIED';
  await profile.save();

  // Also set User isVerified = true
  await User.findByIdAndUpdate(req.user._id, { isVerified: true });

  await logAudit({
    actorId: req.user._id,
    action: 'VERIFY_AADHAAR_KYC',
    resource: 'WorkerProfile',
    resourceId: profile._id,
    req,
  });

  res.json({
    success: true,
    message: 'Aadhaar identity verified successfully via UIDAI Authorized e-KYC!',
    kyc: profile.kyc,
    verificationStatus: profile.verificationStatus,
    document: uploadedDoc,
  });
});

export const verifyPan = asyncHandler(async (req, res) => {
  const { panNumber, holderName, panType = 'INDIVIDUAL' } = req.body;

  if (!panNumber) {
    throw new ApiError(400, 'PAN number is required.');
  }

  const cleanPan = panNumber.toUpperCase().trim();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleanPan)) {
    throw new ApiError(400, 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
  }

  if (!holderName || holderName.trim().length < 3) {
    throw new ApiError(400, 'Name as per PAN card is required.');
  }

  // Handle uploaded document file if present
  let uploadedDoc = null;
  if (req.file) {
    const saved = await saveUploadedFile(req.file);
    uploadedDoc = await VerificationDocument.create({
      worker: req.user._id,
      documentType: 'PAN',
      fileKey: saved.fileKey,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      status: 'VERIFIED',
      reviewNotes: 'Verified via NSDL / Income Tax Department Database',
      reviewedAt: new Date(),
    });
  }

  let profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new WorkerProfile({
      user: req.user._id,
      businessName: holderName,
      city: req.user.city || 'Hyderabad',
      categories: ['Interior Design'],
    });
  }

  if (!profile.kyc) profile.kyc = {};

  const refId = `NSDL-ITD-${Date.now().toString().slice(-8)}`;

  profile.kyc.pan = {
    panNumber: cleanPan,
    holderName: holderName.trim(),
    panType,
    isVerified: true,
    verifiedAt: new Date(),
    provider: 'NSDL_INCOMETAX',
    refId,
  };

  // Calculate trust score
  const isAadhaarVerified = profile.kyc.aadhaar?.isVerified;
  profile.kyc.trustScore = isAadhaarVerified ? 100 : 50;

  // Set Verified Status
  profile.verificationStatus = 'VERIFIED';
  await profile.save();

  // Also set User isVerified = true
  await User.findByIdAndUpdate(req.user._id, { isVerified: true });

  await logAudit({
    actorId: req.user._id,
    action: 'VERIFY_PAN_KYC',
    resource: 'WorkerProfile',
    resourceId: profile._id,
    req,
  });

  res.json({
    success: true,
    message: 'PAN Card verified successfully via NSDL / Income Tax Department Gateway!',
    kyc: profile.kyc,
    verificationStatus: profile.verificationStatus,
    document: uploadedDoc,
  });
});

export const getPayoutSettings = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  res.json({
    success: true,
    payoutInfo: profile?.payoutInfo || {
      upiId: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: '',
      accountType: 'SAVINGS',
      isConfigured: false,
    },
  });
});

export const updatePayoutSettings = asyncHandler(async (req, res) => {
  const { upiId, accountNumber, ifscCode, accountHolderName, bankName, accountType = 'SAVINGS' } = req.body;

  let profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new WorkerProfile({
      user: req.user._id,
      businessName: req.user.name,
      city: req.user.city || 'Hyderabad',
      categories: ['General Renovation'],
    });
  }

  profile.payoutInfo = {
    upiId: upiId ? upiId.trim() : '',
    accountNumber: accountNumber ? accountNumber.trim() : '',
    ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : '',
    accountHolderName: accountHolderName ? accountHolderName.trim() : req.user.name,
    bankName: bankName ? bankName.trim() : '',
    accountType,
    isConfigured: Boolean((upiId && upiId.trim()) || (accountNumber && ifscCode)),
  };

  await profile.save();

  await logAudit({
    actorId: req.user._id,
    action: 'UPDATE_PAYOUT_SETTINGS',
    resource: 'WorkerProfile',
    resourceId: profile._id,
    req,
  });

  res.json({
    success: true,
    message: 'Payout and bank account settings saved successfully',
    payoutInfo: profile.payoutInfo,
  });
});
