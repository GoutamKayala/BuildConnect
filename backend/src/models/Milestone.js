import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agreement',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: Date,
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CLIENT_REVIEW', 'APPROVED', 'COMPLETED', 'DELAYED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAYABLE', 'PAID'],
      default: 'UNPAID',
    },
    attachments: [
      {
        url: String,
        title: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Milestone = mongoose.model('Milestone', milestoneSchema);
export default Milestone;
