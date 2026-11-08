const noteService = require('../services/note.service');

async function list(req, res, next) {
  try {
    const { rows, meta } = await noteService.list(req.query);
    res.json({ success: true, data: rows, meta });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const note = await noteService.create(req.body.content, req.manager._id);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const note = await noteService.update(req.params.noteId, req.body.content);
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await noteService.remove(req.params.noteId);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
