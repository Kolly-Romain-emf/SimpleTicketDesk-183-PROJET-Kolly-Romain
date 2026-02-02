import { Router } from 'express';
import {
  createUser,
  listUsers,
  getMe,
  updateMe,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { ensureAuthenticated } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateAtLeastOne } from '../middlewares/validationMiddleware.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

const idParamSchema = {
  id: { type: 'number', required: true },
};

const createUserSchema = {
  lastname: { type: 'string', required: true, minLength: 1, maxLength: 100, trim: true },
  firstname: { type: 'string', required: true, minLength: 1, maxLength: 100, trim: true },
  email: { type: 'string', required: true, maxLength: 255, pattern: emailPattern, trim: true },
  password: { type: 'string', required: true, minLength: 8, maxLength: 100, pattern: passwordPattern },
  role: { type: 'string', required: false, enum: ['ADMIN', 'USER'] },
};

const updateUserSchema = {
  lastname: { type: 'string', required: false, minLength: 1, maxLength: 100, trim: true },
  firstname: { type: 'string', required: false, minLength: 1, maxLength: 100, trim: true },
  email: { type: 'string', required: false, maxLength: 255, pattern: emailPattern, trim: true },
  role: { type: 'string', required: false, enum: ['ADMIN', 'USER'] },
  password: { type: 'string', required: false, minLength: 8, maxLength: 100, pattern: passwordPattern },
};

const updateProfileSchema = {
  lastname: { type: 'string', required: false, minLength: 1, maxLength: 100, trim: true },
  firstname: { type: 'string', required: false, minLength: 1, maxLength: 100, trim: true },
  email: { type: 'string', required: false, maxLength: 255, pattern: emailPattern, trim: true },
  password: { type: 'string', required: false, minLength: 8, maxLength: 100, pattern: passwordPattern },
};

// Auth + authorization handled in controller for now
router.post('/', ensureAuthenticated, validateBody(createUserSchema), createUser);
router.get('/', ensureAuthenticated, listUsers);
router.get('/me', ensureAuthenticated, getMe);
router.put(
  '/me',
  ensureAuthenticated,
  validateAtLeastOne(['lastname', 'firstname', 'email', 'password']),
  validateBody(updateProfileSchema),
  updateMe
);
router.get('/:id', ensureAuthenticated, validateParams(idParamSchema), getUserById);
router.put(
  '/:id',
  ensureAuthenticated,
  validateParams(idParamSchema),
  validateAtLeastOne(['lastname', 'firstname', 'email', 'role', 'password']),
  validateBody(updateUserSchema),
  updateUser
);
router.delete('/:id', ensureAuthenticated, validateParams(idParamSchema), deleteUser);

export default router;
