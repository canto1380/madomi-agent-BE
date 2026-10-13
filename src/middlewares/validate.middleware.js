export const validate = (schema, source = 'body') => async (req, res, next) => {
  try {
    const data = source === 'params' ? req.params : req.body;
    const parsed = await schema.parseAsync(data);
    if (source === 'params') {
      req.validatedParams = parsed;
    } else {
      req.validatedData = parsed;
    }
    next();
  } catch (error) {
    return res.status(400).json({
      data: null,
      error: 'VALIDATION_ERROR',
      message: 'Error de validación',
      details: error.issues ?? [{ message: error.message }],
    });
  }
};
