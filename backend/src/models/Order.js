const mongoose = require('mongoose');

const orderLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemNameSnapshot: { type: String, required: true },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    clientRequestId: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 25 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    paymentMethod: { type: String, enum: ['cash_on_delivery', 'paymob'], default: 'cash_on_delivery' },
    paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' },
    paymobIntentionId: { type: String, default: '' },
    paymobOrderId: { type: String, default: '' },
    paymobClientSecret: { type: String, default: '', select: false },
    paymobTransactionId: { type: String, default: '' },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 500 },
    items: { type: [orderLineSchema], validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ['opened', 'closed'], default: 'opened' },
    customerNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    managerNotes: { type: String, trim: true, maxlength: 2000, default: '' }
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ customerName: 1 });

module.exports = mongoose.model('Order', orderSchema);
