const { body, param, query } = require('express-validator');

const MAX_LENGTH = 5000;

const noteIdParam = [param('noteId').isUUID().withMessage('Invalid note id')];

// Rejects empty and whitespace-only content. The body is never trusted to set dates or author.
const contentRule = () =>
  body('content')
    .isString()
    .withMessage('Content must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_LENGTH })
    .withMessage(`Content is required (max ${MAX_LENGTH} characters)`);

const list = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const create = [contentRule()];
const update = [...noteIdParam, contentRule()];

module.exports = { noteIdParam, list, create, update };
