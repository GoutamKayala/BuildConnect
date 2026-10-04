import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'sq ft' },
  unitPrice: { type: Number, default: 0 },
  labourCost: { type: Number, default: 0 },
  materialCost: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
});

const quotationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'MODIFICATION_REQUESTED'],
      default: 'DRAFT',
    },
    items: [quotationItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    workerPayoutAmount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    validUntil: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    terms: {
      type: String,
      default: 'Payment terms apply upon agreement signing.',
    },
  },
  {
    timestamps: true,
  }
);

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
