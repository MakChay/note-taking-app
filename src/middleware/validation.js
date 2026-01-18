// src/middleware/validation.js
const Joi = require('joi');

const noteSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).required(),
    category: Joi.string().max(50).default('General'),
    tags: Joi.array().items(Joi.string().max(50)).default([]),
    isPinned: Joi.boolean().default(false),
    isArchived: Joi.boolean().default(false)
});

const bulkOperationSchema = Joi.object({
    action: Joi.string().valid('archive', 'unarchive', 'delete').required(),
    noteIds: Joi.array().items(Joi.string()).min(1).required()
});

const importSchema = Joi.object({
    notes: Joi.array().items(noteSchema).min(1).required()
});

exports.validateNote = (req, res, next) => {
    const { error } = noteSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

exports.validateBulkOperation = (req, res, next) => {
    const { error } = bulkOperationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

exports.validateImport = (req, res, next) => {
    const { error } = importSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};