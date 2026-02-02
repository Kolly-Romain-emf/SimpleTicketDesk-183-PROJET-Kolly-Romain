import bcrypt from 'bcrypt';
import { User } from '../models/userModel.js';
import { AuditLog } from '../models/auditLogModel.js';
import { logger } from '../config/logger.js';

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const isAdmin = (sessionUser) => sessionUser && sessionUser.role === 'ADMIN';
const normalizeRole = (role) => {
  const value = String(role || '').toUpperCase();
  if (value === 'ADMIN') return 'ADMIN';
  return 'USER';
};
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

// POST /api/users (admin)
export const createUser = async (req, res, next) => {
  try {
    if (!req.session?.user || !isAdmin(req.session.user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { lastname, firstname, email, password, role } = req.body || {};
    if (!lastname || !firstname || !email || !password) {
      return res.status(400).json({ error: 'lastname, firstname, email and password are required' });
    }

    const existing = await User.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await User.createNewUser({
      lastname,
      firstname,
      email,
      password_hash,
      role: normalizeRole(role || 'USER'),
    });

    const created = await User.getUserById(result.insertId);
    await AuditLog.create({
      userId: req.session.user.id,
      action: `USER_CREATE pk_user=${created.pk_user}`,
    });
    logger.info(`User created pk_user=${created.pk_user} by user=${req.session.user.id}`);
    return res.status(201).json({ user: created });
  } catch (err) {
    return next(err);
  }
};

// GET /api/users (admin)
export const listUsers = async (req, res, next) => {
  try {
    if (!req.session?.user || !isAdmin(req.session.user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const users = await User.getAllUsers();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
};

// GET /api/users/:id (admin only)
export const getUserById = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const sessionUser = req.session.user;
    if (!isAdmin(sessionUser)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
};

// GET /api/users/me (owner)
export const getMe = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.getUserById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/users/me (owner)
export const updateMe = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.session.user.id;
    if (!id) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const existing = await User.getUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      lastname,
      firstname,
      email,
      password,
    } = req.body || {};

    const updatedUser = {
      lastname: lastname ?? existing.lastname,
      firstname: firstname ?? existing.firstname,
      email: email ?? existing.email,
      role: existing.role,
    };

    if (email && email !== existing.email) {
      const emailOwner = await User.getUserByEmail(email);
      if (emailOwner && emailOwner.pk_user !== id) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await User.updateUserWithPassword(id, { ...updatedUser, password_hash });
    } else {
      await User.updateUser(id, updatedUser);
    }
    const saved = await User.getUserById(id);
    req.session.user.firstname = saved.firstname;
    req.session.user.lastname = saved.lastname;
    req.session.user.email = saved.email;
    await AuditLog.create({
      userId: req.session.user.id,
      action: `USER_UPDATE pk_user=${saved.pk_user}`,
    });
    logger.info(`User updated pk_user=${saved.pk_user} by user=${req.session.user.id}`);
    return res.json({ user: saved });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/users/:id (admin only)
export const updateUser = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const sessionUser = req.session.user;
    if (!isAdmin(sessionUser)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const existing = await User.getUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      lastname,
      firstname,
      email,
      role,
      password,
    } = req.body || {};

    const updatedUser = {
      lastname: lastname ?? existing.lastname,
      firstname: firstname ?? existing.firstname,
      email: email ?? existing.email,
      role: isAdmin(sessionUser) ? normalizeRole(role ?? existing.role) : existing.role,
    };

    if (email && email !== existing.email) {
      const emailOwner = await User.getUserByEmail(email);
      if (emailOwner && emailOwner.pk_user !== id) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await User.updateUserWithPassword(id, { ...updatedUser, password_hash });
    } else {
      await User.updateUser(id, updatedUser);
    }
    const saved = await User.getUserById(id);
    await AuditLog.create({
      userId: req.session.user.id,
      action: `USER_UPDATE pk_user=${saved.pk_user}`,
    });
    logger.info(`User updated pk_user=${saved.pk_user} by user=${req.session.user.id}`);
    return res.json({ user: saved });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/users/:id (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    if (!req.session?.user || !isAdmin(req.session.user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (req.session.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const existing = await User.getUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.deleteUser(id);
    await AuditLog.create({
      userId: req.session.user.id,
      action: `USER_DELETE pk_user=${existing.pk_user}`,
    });
    logger.info(`User deleted pk_user=${existing.pk_user} by user=${req.session.user.id}`);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
