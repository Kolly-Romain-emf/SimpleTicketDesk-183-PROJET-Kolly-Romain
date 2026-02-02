import { AuditLog } from '../models/auditLogModel.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
    const logs = await AuditLog.listRecent(limit);
    return res.json({ logs });
  } catch (err) {
    return next(err);
  }
};
