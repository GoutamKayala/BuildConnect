import mongoose from 'mongoose';

const siteVisitSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: String,
      enum: ['CLIENT', 'WORKER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'REQUESTED',
    },
    visitDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    inspectionPhotos: [
      {
        url: { type: String },
        caption: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);
export default SiteVisit;
