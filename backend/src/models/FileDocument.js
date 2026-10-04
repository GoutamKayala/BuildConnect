import mongoose from 'mongoose';

const fileDocumentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    category: {
      type: String,
      enum: ['PROJECT_FILE', 'CONTRACT', 'INVOICE', 'INSPECTION_PHOTO', 'DESIGN'],
      default: 'PROJECT_FILE',
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
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FileDocument = mongoose.model('FileDocument', fileDocumentSchema);
export default FileDocument;
