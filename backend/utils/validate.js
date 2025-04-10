// backend/utils/validate.js
const validate = async (schema, object) => {
    try {
        await schema.validate(object, { abortEarly: false });
        return { isValid: true, errors: [] };
    } catch (error) {
        return { isValid: false, errors: error.errors };
    }
};

// Middleware for Express routes
const validateMiddleware = (schema) => {
    return async (req, res, next) => {
        const result = await validate(schema, req.body);
        if (!result.isValid) {
            return res.status(400).json({ message: 'Validation error', details: result.errors });
        }
        next();
    };
};

module.exports = { validate, validateMiddleware };