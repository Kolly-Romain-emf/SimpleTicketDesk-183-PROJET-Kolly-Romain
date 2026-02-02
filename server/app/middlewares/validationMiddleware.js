const isEmpty = (value) => value === undefined || value === null || value === '';

const coerceNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return value;
};

const coerceBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return value;
};

const validateValue = (key, value, rules) => {
  if (rules.trim && typeof value === 'string') {
    value = value.trim();
  }

  if (rules.type === 'number') {
    value = coerceNumber(value);
  }
  if (rules.type === 'boolean') {
    value = coerceBoolean(value);
  }

  if (!isEmpty(value)) {
    if (rules.type && typeof value !== rules.type) {
      return { ok: false, value, error: `${key} must be a ${rules.type}` };
    }
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return { ok: false, value, error: `${key} is too short` };
    }
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return { ok: false, value, error: `${key} is too long` };
    }
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return { ok: false, value, error: `${key} is invalid` };
    }
    if (rules.enum && !rules.enum.includes(value)) {
      return { ok: false, value, error: `${key} must be one of ${rules.enum.join(', ')}` };
    }
  }

  return { ok: true, value };
};

export const validateBody = (schema) => (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  const sanitized = { ...body };

  Object.entries(schema).forEach(([key, rules]) => {
    let value = body[key];
    if (isEmpty(value)) {
      if (rules.required) {
        errors.push(`${key} is required`);
      }
      return;
    }

    const result = validateValue(key, value, rules);
    if (!result.ok) {
      errors.push(result.error);
    } else {
      sanitized[key] = result.value;
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] });
  }

  req.body = sanitized;
  return next();
};

export const validateParams = (schema) => (req, res, next) => {
  const params = req.params || {};
  const errors = [];
  const sanitized = { ...params };

  Object.entries(schema).forEach(([key, rules]) => {
    let value = params[key];
    if (isEmpty(value)) {
      if (rules.required) {
        errors.push(`${key} is required`);
      }
      return;
    }

    const result = validateValue(key, value, rules);
    if (!result.ok) {
      errors.push(result.error);
    } else {
      sanitized[key] = result.value;
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] });
  }

  req.params = sanitized;
  return next();
};

export const validateAtLeastOne = (fields, source = 'body') => (req, res, next) => {
  const data = source === 'params' ? (req.params || {}) : (req.body || {});
  const hasValue = fields.some((field) => !isEmpty(data[field]));
  if (!hasValue) {
    return res.status(400).json({ error: `At least one of ${fields.join(', ')} is required` });
  }
  return next();
};
