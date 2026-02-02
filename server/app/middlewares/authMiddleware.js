// Session-based auth middleware
export const ensureAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient role.' });
  }
  return next();
};
