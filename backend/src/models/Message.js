import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [
      {
        url: { type: String, required: true },
        originalName: String,
        mimeType: String,
        size: Number,
      },
    ],
    messageType: {
      type: String,
      enum: ['TEXT', 'LOCATION_SHARE', 'SITE_VISIT', 'QUOTATION', 'DEAL_FINALIZED'],
      default: 'TEXT',
    },
    locationData: {
      address: String,
      city: String,
      area: String,
      landmark: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      visitDate: Date,
      visitTime: String,
      notes: String,
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'VISITED', 'CANCELLED'],
        default: 'PENDING',
      },
      siteAnalysis: {
        inspectedAt: Date,
        notes: String,
        workScope: String,
      },
    },
    quotationData: {
      quoteNumber: String,
      subtotal: Number,
      platformFee: Number,
      workerPayoutAmount: Number,
      totalAmount: Number,
      workerPayoutInfo: {
        upiId: String,
        bankName: String,
        accountMasked: String,
      },
      items: [
        {
          title: String,
          amount: Number,
        },
      ],
      timeline: String,
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING',
      },
      acceptedAt: Date,
      paymentStatus: {
        type: String,
        enum: ['UNPAID', 'ESCROW_LOCKED', 'PAID'],
        default: 'UNPAID',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
