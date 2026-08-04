import { execute } from "../config/database.js";

class User {
    static async findByEmail(email) {
        const [rows] = await execute(
            'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] ?? null;
    }

    static async findById(id) {
        const [rows] = await execute(
            'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] ?? null;
    }

    static async create({ name, email, passwordHash }) {
        const [result] = await execute(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, passwordHash]
        );
        return {
            id: result.insertId,
            name,
            email
        };
    }
}

export default User;