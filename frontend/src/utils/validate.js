// frontend/src/utils/validate.js
const Yup = require('yup');

const validateField = async (schema, fieldName, value) => {
    try {
        await schema.validateAt(fieldName, { [fieldName]: value });
        return '';
    } catch (error) {
        return error.message;
    }
};

const validate = async (schema, object) => {
    try {
        await schema.validate(object, { abortEarly: false });
        return { isValid: true, errors: [] };
    } catch (error) {
        return { isValid: false, errors: error.errors };
    }
};

module.exports = { validateField, validate }; 