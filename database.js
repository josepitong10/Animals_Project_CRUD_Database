require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,

    ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false
    }
});

function formatAnimal(row) {
    return {
        id: row.id,
        name: row.name,
        numLegs: row.num_legs,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    pool,
    formatAnimal
};