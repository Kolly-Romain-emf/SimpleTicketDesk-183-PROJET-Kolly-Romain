import { db } from '../config/db.js';

// Acces DB pour les statuts
export class Status {
    static async getAll() {
        const [rows] = await db.query('SELECT pk_status, label FROM t_status');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT pk_status, label FROM t_status WHERE pk_status = ?', [id]);
        return rows[0];
    }

    static async create(label) {
        const [result] = await db.query('INSERT INTO t_status (label) VALUES (?)', [label]);
        return result;
    }

    static async update(id, label) {
        const [result] = await db.query('UPDATE t_status SET label = ? WHERE pk_status = ?', [label, id]);
        return result;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM t_status WHERE pk_status = ?', [id]);
        return result;
    }
}
