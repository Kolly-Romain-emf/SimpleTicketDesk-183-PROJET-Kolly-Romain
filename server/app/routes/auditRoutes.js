import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/audit', requireRole(['ADMIN']), listAuditLogs);

export default router;
