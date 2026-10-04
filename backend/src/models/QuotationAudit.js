import mongoose from 'mongoose';

const quotationAuditSchema = new mongoose.Schema(
  {
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
      index: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    previousStatus: String,
    newStatus: String,
    snapshotData: {
      type: mongoose.Schema.Types.Mixed,
    },
    changeDescription: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const QuotationAudit = mongoose.model('QuotationAudit', quotationAuditSchema);
export default QuotationAudit;
