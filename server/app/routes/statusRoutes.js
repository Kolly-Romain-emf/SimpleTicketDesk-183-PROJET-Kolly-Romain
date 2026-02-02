import { Router } from 'express';
import {
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from '../controllers/statusController.js';
import { ensureAuthenticated, requireRole } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validationMiddleware.js';

const router = Router();

const idParamSchema = {
  id: { type: 'number', required: true },
};

const statusSchema = {
  label: { type: 'string', required: true, minLength: 1, maxLength: 50, trim: true },
};

// Lecture publique (peut etre protege si besoin)
router.get('/', listStatuses);

// Gestion des statuts (admin)
router.post('/', ensureAuthenticated, requireRole('ADMIN'), validateBody(statusSchema), createStatus);
router.put(
  '/:id',
  ensureAuthenticated,
  requireRole('ADMIN'),
  validateParams(idParamSchema),
  validateBody(statusSchema),
  updateStatus
);
router.delete('/:id', ensureAuthenticated, requireRole('ADMIN'), validateParams(idParamSchema), deleteStatus);

export default router;
