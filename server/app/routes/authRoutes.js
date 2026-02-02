import { Router } from 'express';
import { login, loginMfa, register, logout, me, enableMfa } from '../controllers/authController.js';
import { ensureAuthenticated } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validationMiddleware.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

const normalizeRegisterBody = (req, _res, next) => {
  const body = req.body || {};
  const lastname = body.lastname || body.lastName;
  const firstname = body.firstname || body.firstName;
  req.body = { ...body, lastname, firstname };
  return next();
};

const registerSchema = {
  lastname: { type: 'string', required: true, minLength: 1, maxLength: 100, trim: true },
  firstname: { type: 'string', required: true, minLength: 1, maxLength: 100, trim: true },
  email: { type: 'string', required: true, maxLength: 255, pattern: emailPattern, trim: true },
  password: { type: 'string', required: true, minLength: 8, maxLength: 100, pattern: passwordPattern },
};

const loginSchema = {
  email: { type: 'string', required: true, maxLength: 255, pattern: emailPattern, trim: true },
  password: { type: 'string', required: true, minLength: 8, maxLength: 100 },
};

const loginMfaSchema = {
  email: { type: 'string', required: true, maxLength: 255, pattern: emailPattern, trim: true },
  password: { type: 'string', required: true, minLength: 8, maxLength: 100 },
  token: { type: 'string', required: true, pattern: /^\d{6}$/ },
};

const loginRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10, keyPrefix: 'login' });
const mfaRateLimit = rateLimit({ windowMs: 60 * 1000, max: 5, keyPrefix: 'login-mfa' });
const enableMfaRateLimit = rateLimit({ windowMs: 60 * 1000, max: 3, keyPrefix: 'enable-mfa' });

router.post('/register', normalizeRegisterBody, validateBody(registerSchema), register);
router.post('/login', loginRateLimit, validateBody(loginSchema), login);
router.post('/login-mfa', mfaRateLimit, validateBody(loginMfaSchema), loginMfa);
router.post('/logout', logout);
router.get('/me', ensureAuthenticated, me);
router.post('/enable-mfa', ensureAuthenticated, enableMfaRateLimit, enableMfa);

export default router;
