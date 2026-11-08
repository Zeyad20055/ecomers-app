const categoryService = require('../services/category.service');

async function list(req, res, next) {
  try {
    const { rows, meta } = await categoryService.list(req.query, req.isManagerScope);
    res.json({ success: true, data: rows, meta });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const category = await categoryService.getById(req.params.id, req.isManagerScope);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.remove(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
