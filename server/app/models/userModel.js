import { db } from '../config/db.js';

// Acces DB minimal : on laisse les erreurs remonter vers les controllers.
export class User {
    static async getAllUsers() {
        const [rows] = await db.query('SELECT pk_user, lastname, firstname, email, role, created_at, updated_at FROM t_user');
        return rows;
    }

    static async getUserById(id) {
        const [rows] = await db.query(
            'SELECT pk_user, lastname, firstname, email, role, created_at, updated_at FROM t_user WHERE pk_user = ?',
            [id]
        );
        return rows[0];
    }

    static async getUserByEmail(email) {
        const [rows] = await db.query(
            'SELECT pk_user, lastname, firstname, email, password_hash, mfa_secret_base32, role, created_at, updated_at FROM t_user WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async createNewUser(user) {
        const [result] = await db.query(
            'INSERT INTO t_user (lastname, firstname, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [user.lastname, user.firstname, user.email, user.password_hash, user.role]
        );
        return result;
    }

    static async updateUser(id, user) {
        const [result] = await db.query(
            'UPDATE t_user SET lastname = ?, firstname = ?, email = ?, role = ? WHERE pk_user = ?',
            [user.lastname, user.firstname, user.email, user.role, id]
        );
        return result;
    }

    static async updateUserWithPassword(id, user) {
        const [result] = await db.query(
            'UPDATE t_user SET lastname = ?, firstname = ?, email = ?, role = ?, password_hash = ? WHERE pk_user = ?',
            [user.lastname, user.firstname, user.email, user.role, user.password_hash, id]
        );
        return result;
    }

    static async deleteUser(id) {
        const [result] = await db.query('DELETE FROM t_user WHERE pk_user = ?', [id]);
        return result;
    }

    static async updateMfaSecret(id, secretBase32) {
        const [result] = await db.query(
            'UPDATE t_user SET mfa_secret_base32 = ? WHERE pk_user = ?',
            [secretBase32, id]
        );
        return result;
    }
}
