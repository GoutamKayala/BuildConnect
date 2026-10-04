import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    propertyType: {
      type: String,
      default: 'Apartment',
    },
    estimatedBudget: {
      type: Number,
      default: 0,
    },
    preferredStartDate: {
      type: Date,
    },
    expectedCompletionDate: {
      type: Date,
    },
    publicLocation: {
      city: { type: String, required: true },
      area: { type: String, default: '' },
    },
    exactAddress: {
      street: { type: String, default: '' },
      landmark: { type: String, default: '' },
      pincode: { type: String, default: '' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    locationSharedWithWorker: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'REQUESTED',
        'SITE_VISIT_PENDING',
        'QUOTATION_PENDING',
        'AGREEMENT_PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
      index: true,
    },
    stage: {
      type: String,
      enum: [
        'PLANNING',
        'SITE_VISIT',
        'DESIGN',
        'APPROVAL',
        'PROCUREMENT',
        'EXECUTION',
        'INSPECTION',
        'COMPLETION',
        'FINAL_PAYMENT',
        'REVIEWED',
      ],
      default: 'PLANNING',
    },
    images: [
      {
        url: { type: String },
        caption: { type: String },
      },
    ],
    documents: [
      {
        url: { type: String },
        title: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
