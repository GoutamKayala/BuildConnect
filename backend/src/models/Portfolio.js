import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Portfolio project title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    locationCity: {
      type: String,
      default: '',
    },
    budgetRange: {
      type: String,
      default: '',
    },
    completionDate: {
      type: Date,
    },
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
      },
    ],
    videos: [
      {
        url: { type: String },
        caption: { type: String, default: '' },
      },
    ],
    materialsUsed: [
      {
        type: String,
        trim: true,
      },
    ],
    servicesProvided: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
