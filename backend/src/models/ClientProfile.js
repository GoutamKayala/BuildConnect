import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    preferredLanguage: {
      type: String,
      default: 'English',
    },
    projectInterests: [
      {
        type: String,
        trim: true,
      },
    ],
    savedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);
export default ClientProfile;
