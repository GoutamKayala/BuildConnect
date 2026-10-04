import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'MESSAGE',
        'PROJECT_REQUEST',
        'SITE_VISIT_REQUEST',
        'SITE_VISIT_APPROVAL',
        'QUOTATION_NEW',
        'QUOTATION_ACCEPTED',
        'QUOTATION_REJECTED',
        'QUOTATION_MODIFIED',
        'AGREEMENT_CREATED',
        'MILESTONE_UPDATE',
        'PAYMENT_RECEIVED',
        'INVOICE_GENERATED',
        'VERIFICATION_STATUS',
        'REVIEW_RECEIVED',
        'SECURITY_ALERT',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
