const validateField = async (schema, fieldName, value) => {
    try {
        await schema.validateAt(fieldName, { [fieldName]: value });
        return '';
    } catch (error) {
        return error.message;
    }
};

module.exports = { validateField };