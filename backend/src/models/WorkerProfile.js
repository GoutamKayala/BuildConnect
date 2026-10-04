import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    categories: [
      {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
    ],
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    serviceRadiusKm: {
      type: Number,
      default: 25,
    },
    serviceAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    pricingInfo: {
      hourlyRate: { type: Number, default: 250 },
      dailyRate: { type: Number, default: 1200 },
      startingPrice: { type: Number, default: 2500 },
      siteVisitFee: { type: Number, default: 0 }, // 0 = Free Site Visit Consultation
      avgProjectBudget: { type: String, default: 'Flexible' },
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    verificationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    verificationRejectionReason: {
      type: String,
      default: '',
    },
    kyc: {
      aadhaar: {
        numberMasked: { type: String, default: '' },
        holderName: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        provider: { type: String, default: 'UIDAI_DIGILOCKER' },
        refId: { type: String, default: '' },
      },
      pan: {
        panNumber: { type: String, default: '' },
        holderName: { type: String, default: '' },
        panType: { type: String, default: 'INDIVIDUAL' },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        provider: { type: String, default: 'NSDL_INCOMETAX' },
        refId: { type: String, default: '' },
      },
      trustScore: { type: Number, default: 0 },
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
    responseTimeHours: {
      type: Number,
      default: 2,
    },
    payoutInfo: {
      upiId: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountType: { type: String, enum: ['SAVINGS', 'CURRENT'], default: 'SAVINGS' },
      isConfigured: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
workerProfileSchema.index({ categories: 1, city: 1, verificationStatus: 1 });
workerProfileSchema.index({ avgRating: -1, completedProjectsCount: -1 });

const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);
export default WorkerProfile;
