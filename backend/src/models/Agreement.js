import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
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
    },
    version: {
      type: Number,
      default: 1,
    },
    scopeOfWork: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    timeline: {
      startDate: Date,
      expectedEndDate: Date,
    },
    termsAndConditions: {
      type: String,
      default: 'Standard platform project agreement terms.',
    },
    signedByClientAt: Date,
    signedByWorkerAt: Date,
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_SIGNATURES',
    },
    clientAudit: {
      ip: String,
      userAgent: String,
      signedAt: Date,
    },
    workerAudit: {
      ip: String,
      userAgent: String,
      signedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Agreement = mongoose.model('Agreement', agreementSchema);
export default Agreement;
