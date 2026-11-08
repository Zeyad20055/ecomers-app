const Category = require('../models/Category');
const Item = require('../models/Item');
const { createHttpError } = require('../middlewares/error.middleware');

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function list({ search, page = 1, limit = 100, active }, includeInactive) {
  const filter = {};
  if (!includeInactive) filter.isActive = true;
  else if (active === 'true' || active === 'false') filter.isActive = active === 'true';
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const [rows, total] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Category.countDocuments(filter)
  ]);
  return { rows, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getById(id, includeInactive) {
  const category = await Category.findById(id).lean();
  if (!category || (!includeInactive && !category.isActive)) {
    throw createHttpError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }
  return category;
}

// Case-insensitive duplicate check (the unique collation index remains the final guard).
async function assertNameAvailable(name, excludeId) {
  const filter = { name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Category.exists(filter)) {
    throw createHttpError(409, 'A category with this name already exists', 'CATEGORY_NAME_EXISTS');
  }
}

async function create(data) {
  await assertNameAvailable(data.name);
  const category = await Category.create({
    name: data.name,
    description: data.description,
    image: data.image,
    isActive: data.isActive
  });
  return category.toObject();
}

async function update(id, data) {
  const allowed = {};
  ['name', 'description', 'image', 'isActive'].forEach((k) => {
    if (data[k] !== undefined) allowed[k] = data[k];
  });
  if (allowed.name !== undefined) await assertNameAvailable(allowed.name, id);
  const category = await Category.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).lean();
  if (!category) throw createHttpError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  return category;
}

async function remove(id) {
  const category = await Category.findById(id);
  if (!category) throw createHttpError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  const itemCount = await Item.countDocuments({ category: id });
  if (itemCount > 0) {
    throw createHttpError(
      409,
      'This category still contains items. Move or delete them first.',
      'CATEGORY_HAS_ITEMS'
    );
  }
  await category.deleteOne();
}

module.exports = { list, getById, create, update, remove };
