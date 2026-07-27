const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to format animal data from database
const formatAnimal = (dbAnimal) => {
    return {
        id: dbAnimal.id,
        name: dbAnimal.name.toUpperCase(),
        numLegs: dbAnimal.num_legs
    };
};

module.exports = {
    pool,
    formatAnimal
};