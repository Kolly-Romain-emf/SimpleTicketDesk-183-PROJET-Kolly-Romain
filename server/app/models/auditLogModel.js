import { db } from '../config/db.js';

export class AuditLog {
  static async create({ userId, action }) {
    const [result] = await db.query(
      'INSERT INTO audit_log (fk_user, action) VALUES (?, ?)',
      [userId || null, action]
    );
    return result;
  }

  static async listRecent(limit = 50) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 50;
    const [rows] = await db.query(
      `SELECT a.pk_audit_log, a.fk_user, a.action, a.created_at,
              u.email AS user_email, u.role AS user_role
       FROM audit_log a
       LEFT JOIN t_user u ON a.fk_user = u.pk_user
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [safeLimit]
    );
    return rows;
  }
}
