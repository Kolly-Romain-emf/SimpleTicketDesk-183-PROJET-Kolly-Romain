import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { AuthCompareLoginService } from '../services/AuthCompareLoginService.js';
import { AuthRegisterService } from '../services/AuthRegisterService.js';
import { User } from '../models/userModel.js';
import { logger } from '../config/logger.js';

const normalizeRole = (roleValue) => {
  const value = String(roleValue || '').toUpperCase();
  if (value === 'ADMIN') return 'ADMIN';
  return 'USER';
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthCompareLoginService.compareLogin(email, password);
    if (!result.ok) {
      logger.warn(`Login failed for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!req.session) {
      return res.status(500).json({ error: 'Session unavailable' });
    }

    if (result.mfaSecret) {
      logger.info(`Login requires MFA for ${email}`);
      return res.json({ mfaRequired: true });
    }

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      // Hydrate session with minimal user info
      req.session.user = {
        id: result.user.pk_user,
        role: normalizeRole(result.user.role),
        email: result.user.email,
        lastname: result.user.lastname,
        firstname: result.user.firstname,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        logger.info(`Login success for ${email}`);
        return res.json({ user: result.user });
      });
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login-mfa
 * Body: { email, password, token }
 */
export const loginMfa = async (req, res, next) => {
  try {
    const { email, password, token } = req.body || {};
    if (!email || !password || !token) {
      return res.status(400).json({ error: 'Email, password and token are required' });
    }

    const result = await AuthCompareLoginService.compareLogin(email, password);
    if (!result.ok) {
      logger.warn(`Login MFA failed (bad credentials) for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!result.mfaSecret) {
      logger.warn(`Login MFA failed (not enabled) for ${email}`);
      return res.status(400).json({ error: 'MFA not enabled' });
    }

    const isValid = speakeasy.totp.verify({
      secret: result.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      logger.warn(`Login MFA failed (invalid token) for ${email}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!req.session) {
      return res.status(500).json({ error: 'Session unavailable' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.user = {
        id: result.user.pk_user,
        role: normalizeRole(result.user.role),
        email: result.user.email,
        lastname: result.user.lastname,
        firstname: result.user.firstname,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        logger.info(`Login MFA success for ${email}`);
        return res.json({ user: result.user });
      });
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/register
 * Body: { lastname, firstname, email, password, role? }
 */
export const register = async (req, res, next) => {
  try {
    const { lastname, firstname, lastName, firstName, email, password, role } = req.body || {};
    const ln = lastname || lastName;
    const fn = firstname || firstName;

    if (!ln || !fn || !email || !password) {
      return res.status(400).json({ error: 'lastname/firstname, email and password are required' });
    }

    const result = await AuthRegisterService.registerUser({ lastname: ln, firstname: fn, email, password, role });
    if (!result.ok) {
      const status = result.reason === 'EMAIL_EXISTS' ? 409 : 400;
      const message = result.reason === 'EMAIL_EXISTS' ? 'Email already exists' : 'Registration failed';
      return res.status(status).json({ error: message });
    }

    if (!req.session) {
      return res.status(500).json({ error: 'Session unavailable' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.user = {
        id: result.user.pk_user,
        role: normalizeRole(result.user.role),
        email: result.user.email,
        lastname: result.user.lastname,
        firstname: result.user.firstname,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        return res.status(201).json({ user: result.user });
      });
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 * (cote client : supprimer le token)
 */
export const logout = async (_req, res) => {
  const cookieName = _req.session?.cookie?.name || 'connect.sid';
  _req.session?.destroy(() => {
    res.clearCookie(cookieName);
    return res.status(200).json({ message: 'Logged out' });
  });
};

/**
 * GET /api/auth/me
 * Suppose que req.user est renseigne par un middleware verifyToken
 */
export const me = async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: req.session.user });
};

/**
 * POST /api/auth/enable-mfa
 * Requires authenticated session
 */
export const enableMfa = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = req.session.user.email;
    const secret = speakeasy.generateSecret({
      name: `SimpleTicketDesk (${email})`,
      issuer: 'SimpleTicketDesk',
    });

    await User.updateMfaSecret(req.session.user.id, secret.base32);

    const qrCodeBase64 = await qrcode.toDataURL(secret.otpauth_url);

    return res.json({
      secretBase32: secret.base32,
      qrCodeBase64,
    });
  } catch (err) {
    return next(err);
  }
};
