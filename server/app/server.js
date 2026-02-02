import express from 'express';
import { sessionMiddleware } from './config/session.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { logger } from './config/logger.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(sessionMiddleware());

app.use((req, _res, next) => {
  const user = req.session?.user?.email || 'anonymous';
  logger.info(`${req.method} ${req.originalUrl} by ${user}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/admin', auditRoutes);

// Middleware global d'erreurs
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://0.0.0.0:${port}`);
});

export default app;
