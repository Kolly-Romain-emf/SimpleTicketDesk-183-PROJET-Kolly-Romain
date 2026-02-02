import { logger } from '../config/logger.js';

// Middleware global de gestion des erreurs
export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message || 'Error';
  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${message}`);
  }
  res.status(status).json({ error: message });
};
