import mongoose from 'mongoose';

const verificationDocumentSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['ID_PROOF', 'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'TRADE_LICENSE', 'PORTFOLIO_PROOF', 'AADHAAR', 'PAN'],
      required: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

const VerificationDocument = mongoose.model('VerificationDocument', verificationDocumentSchema);
export default VerificationDocument;
