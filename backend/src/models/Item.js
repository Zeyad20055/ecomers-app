const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Item name is required'], trim: true, maxlength: 150 },
    description: { type: String, required: [true, 'Item description is required'], trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: [0, 'Price must be non-negative'] },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity must be non-negative'],
      validate: { validator: Number.isInteger, message: 'Quantity must be an integer' }
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, trim: true, maxlength: 2000, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

itemSchema.index({ category: 1, isActive: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ name: 1 });

module.exports = mongoose.model('Item', itemSchema);
