const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

export const rateLimit = ({ windowMs, max, keyPrefix = 'rl' }) => {

  const store = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const entry = store.get(key);

    if (!entry || now - entry.start >= windowMs) {
      store.set(key, { start: now, count: 1 });
      return next();
    }

    entry.count += 1;
    store.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    return next();
  };
};
