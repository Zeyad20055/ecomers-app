const itemService = require('../services/item.service');

async function list(req, res, next) {
  try {
    const { rows, meta } = await itemService.list(req.query, req.isManagerScope);
    res.json({ success: true, data: rows, meta });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const item = await itemService.getById(req.params.id, req.isManagerScope);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await itemService.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await itemService.update(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await itemService.remove(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
