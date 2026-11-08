const crypto = require('crypto');
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    // Public, stable identifier used by the API (the Mongo _id is never exposed for notes).
    noteId: { type: String, required: true, unique: true, immutable: true, default: () => crypto.randomUUID() },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxlength: [5000, 'Note content is too long (max 5000 characters)'],
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Note content cannot be empty'
      }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true, immutable: true, index: true }
  },
  // createdAt / updatedAt are set by Mongoose on the server. Dates are stored as BSON Dates (UTC)
  // and serialized as ISO-8601 strings ending in "Z".
  { timestamps: true }
);

noteSchema.index({ createdAt: -1 });

noteSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Note', noteSchema);
