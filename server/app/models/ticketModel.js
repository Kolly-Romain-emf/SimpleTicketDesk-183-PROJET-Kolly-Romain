import { db } from '../config/db.js';

// Acces DB minimal, requetes parametrees pour eviter l'injection.
export class Ticket {
    static async getAllTickets() {
        const [rows] = await db.query(
            `SELECT t.pk_ticket, t.title, t.description, t.fk_status, s.label AS status_label,
                    t.is_public, t.fk_user, t.created_at, t.updated_at
             FROM t_ticket t
             JOIN t_status s ON t.fk_status = s.pk_status`
        );
        return rows;
    }

    static async getPublicTickets() {
        const [rows] = await db.query(
            `SELECT t.pk_ticket, t.title, t.description, t.fk_status, s.label AS status_label,
                    t.is_public, t.fk_user, t.created_at, t.updated_at
             FROM t_ticket t
             JOIN t_status s ON t.fk_status = s.pk_status
             WHERE t.is_public = 1`
        );
        return rows;
    }

    static async getTicketsByUser(userId) {
        const [rows] = await db.query(
            `SELECT t.pk_ticket, t.title, t.description, t.fk_status, s.label AS status_label,
                    t.is_public, t.fk_user, t.created_at, t.updated_at
             FROM t_ticket t
             JOIN t_status s ON t.fk_status = s.pk_status
             WHERE t.fk_user = ?`,
            [userId]
        );
        return rows;
    }

    static async getTicketById(id) {
        const [rows] = await db.query(
            `SELECT t.pk_ticket, t.title, t.description, t.fk_status, s.label AS status_label,
                    t.is_public, t.fk_user, t.created_at, t.updated_at
             FROM t_ticket t
             JOIN t_status s ON t.fk_status = s.pk_status
             WHERE t.pk_ticket = ?`,
            [id]
        );
        return rows[0];
    }

    static async createNew(ticket) {
        const [result] = await db.query(
            'INSERT INTO t_ticket (title, description, fk_status, is_public, fk_user) VALUES (?, ?, ?, ?, ?)',
            [ticket.title, ticket.description, ticket.fk_status, ticket.is_public, ticket.fk_user]
        );
        return result;
    }

    static async updateTicket(id, ticket) {
        const [result] = await db.query(
            'UPDATE t_ticket SET title = ?, description = ?, fk_status = ?, is_public = ? WHERE pk_ticket = ?',
            [ticket.title, ticket.description, ticket.fk_status, ticket.is_public, id]
        );
        return result;
    }

    static async deleteTicket(id) {
        const [result] = await db.query('DELETE FROM t_ticket WHERE pk_ticket = ?', [id]);
        return result;
    }
}
