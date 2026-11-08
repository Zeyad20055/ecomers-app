const Note = require('../models/Note');
const { createHttpError } = require('../middlewares/error.middleware');

const AUTHOR_FIELDS = 'name';

function notFound() {
  return createHttpError(404, 'Note not found', 'NOTE_NOT_FOUND');
}

async function withAuthor(note) {
  await note.populate('createdBy', AUTHOR_FIELDS);
  return note.toJSON();
}

// Newest first. _id is a tiebreaker so notes created in the same millisecond keep a stable order.
async function list({ page = 1, limit = 20 }) {
  const [docs, total] = await Promise.all([
    Note.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', AUTHOR_FIELDS),
    Note.countDocuments()
  ]);
  return {
    rows: docs.map((d) => d.toJSON()),
    meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function create(content, managerId) {
  const note = await Note.create({ content, createdBy: managerId });
  return withAuthor(note);
}

async function update(noteId, content) {
  const note = await Note.findOne({ noteId });
  if (!note) throw notFound();
  note.content = content;
  await note.save(); // runs validators and refreshes updatedAt
  return withAuthor(note);
}

async function remove(noteId) {
  const note = await Note.findOneAndDelete({ noteId });
  if (!note) throw notFound();
}

module.exports = { list, create, update, remove };
