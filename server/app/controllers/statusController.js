import { Status } from '../models/statusModel.js';
import { AuditLog } from '../models/auditLogModel.js';
import { logger } from '../config/logger.js';

export const listStatuses = async (_req, res, next) => {
  try {
    const statuses = await Status.getAll();
    return res.json({ statuses });
  } catch (err) {
    return next(err);
  }
};

export const createStatus = async (req, res, next) => {
  try {
    const { label } = req.body || {};
    if (!label) {
      return res.status(400).json({ error: 'label is required' });
    }
    const result = await Status.create(label);
    const created = await Status.getById(result.insertId);
    const actorId = req.session?.user?.id || null;
    await AuditLog.create({
      userId: actorId,
      action: `STATUS_CREATE pk_status=${created.pk_status}`,
    });
    logger.info(`Status created pk_status=${created.pk_status} by user=${actorId || 'anonymous'}`);
    return res.status(201).json({ status: created });
  } catch (err) {
    return next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { label } = req.body || {};
    if (!label) {
      return res.status(400).json({ error: 'label is required' });
    }
    const existing = await Status.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Status not found' });
    }
    await Status.update(req.params.id, label);
    const updated = await Status.getById(req.params.id);
    const actorId = req.session?.user?.id || null;
    await AuditLog.create({
      userId: actorId,
      action: `STATUS_UPDATE pk_status=${updated.pk_status}`,
    });
    logger.info(`Status updated pk_status=${updated.pk_status} by user=${actorId || 'anonymous'}`);
    return res.json({ status: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteStatus = async (req, res, next) => {
  try {
    const existing = await Status.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Status not found' });
    }
    await Status.delete(req.params.id);
    const actorId = req.session?.user?.id || null;
    await AuditLog.create({
      userId: actorId,
      action: `STATUS_DELETE pk_status=${existing.pk_status}`,
    });
    logger.info(`Status deleted pk_status=${existing.pk_status} by user=${actorId || 'anonymous'}`);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
