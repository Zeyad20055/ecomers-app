const Category = require('../models/Category');
const Item = require('../models/Item');
const { createHttpError } = require('../middlewares/error.middleware');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name: { name: 1, _id: 1 }
};

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Public shape: NEVER includes the exact inventory quantity.
function toPublic(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    image: doc.image,
    category: doc.category && doc.category._id ? { _id: doc.category._id, name: doc.category.name } : doc.category,
    isFeatured: doc.isFeatured,
    isAvailable: doc.quantity > 0,
    createdAt: doc.createdAt
  };
}

function toManager(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    quantity: doc.quantity,
    image: doc.image,
    category: doc.category && doc.category._id ? { _id: doc.category._id, name: doc.category.name } : doc.category,
    isActive: doc.isActive,
    isFeatured: doc.isFeatured,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function list(query, isManager) {
  const { search, category, sort = 'newest', featured, active, page = 1, limit = 12 } = query;
  const filter = {};

  if (isManager) {
    if (active === 'true' || active === 'false') filter.isActive = active === 'true';
    if (category) filter.category = String(category);
  } else {
    filter.isActive = true;
    const activeCategoryIds = (await Category.find({ isActive: true }).select('_id').lean()).map((c) => c._id.toString());
    if (category) {
      filter.category = activeCategoryIds.includes(String(category)) ? String(category) : { $in: [] };
    } else {
      filter.category = { $in: activeCategoryIds };
    }
  }
  if (featured === 'true') filter.isFeatured = true;
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  const [rows, total] = await Promise.all([
    Item.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name')
      .lean(),
    Item.countDocuments(filter)
  ]);
  return {
    rows: rows.map(isManager ? toManager : toPublic),
    meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function getById(id, isManager) {
  const item = await Item.findById(id).populate('category', 'name isActive').lean();
  const hidden = !item || (!isManager && (!item.isActive || !item.category || !item.category.isActive));
  if (hidden) throw createHttpError(404, 'Item not found', 'ITEM_NOT_FOUND');
  return isManager ? toManager(item) : toPublic(item);
}

async function assertCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw createHttpError(400, 'Category does not exist', 'CATEGORY_NOT_FOUND');
}

async function create(data) {
  await assertCategoryExists(data.category);
  const item = await Item.create({
    name: data.name,
    description: data.description,
    price: round2(data.price),
    quantity: data.quantity,
    category: data.category,
    image: data.image,
    isActive: data.isActive,
    isFeatured: data.isFeatured
  });
  return getById(item._id, true);
}

async function update(id, data) {
  const allowed = {};
  ['name', 'description', 'quantity', 'category', 'image', 'isActive', 'isFeatured'].forEach((k) => {
    if (data[k] !== undefined) allowed[k] = data[k];
  });
  if (data.price !== undefined) allowed.price = round2(data.price);
  if (allowed.category) await assertCategoryExists(allowed.category);
  const item = await Item.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).lean();
  if (!item) throw createHttpError(404, 'Item not found', 'ITEM_NOT_FOUND');
  return getById(id, true);
}

async function remove(id) {
  const item = await Item.findByIdAndDelete(id);
  if (!item) throw createHttpError(404, 'Item not found', 'ITEM_NOT_FOUND');
}

module.exports = { list, getById, create, update, remove };
