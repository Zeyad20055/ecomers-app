const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, trim: true, maxlength: 2000, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Case-insensitive uniqueness of category names
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
