import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const memoryStore = {
    users: [],
    animals: [],
    nextUserId: 1,
    nextAnimalId: 1
};

let useMemory = process.env.DB_USE_MEMORY === "true";

const poolOptions = {
    host: process.env.DB_HOST || process.env.DB_HOSTNAME || "127.0.0.1",
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ojt_store",
    waitForConnections: true,
    connectionLimit: 10
};

if (process.env.DATABASE_URL) {
    try {
        const databaseUrl = new URL(process.env.DATABASE_URL);
        poolOptions.host = databaseUrl.hostname || poolOptions.host;
        poolOptions.port = Number(databaseUrl.port || process.env.DB_PORT || 4000);
        poolOptions.user = decodeURIComponent(databaseUrl.username || poolOptions.user);
        poolOptions.password = decodeURIComponent(databaseUrl.password || poolOptions.password);
        poolOptions.database = databaseUrl.pathname.replace(/^\/+/, "") || poolOptions.database;

        if (databaseUrl.searchParams.get("ssl") === "true" || databaseUrl.searchParams.get("sslmode") === "require") {
            poolOptions.ssl = {
                minVersion: "TLSv1.2",
                rejectUnauthorized: false
            };
        }
    } catch (error) {
        console.warn("Invalid DATABASE_URL provided, falling back to individual DB settings.", error.message);
    }
}

if (process.env.DB_SSL === "true") {
    poolOptions.ssl = {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false
    };
}

let pool;

try {
    if (!useMemory) {
        pool = mysql.createPool(poolOptions);
    }
} catch (error) {
    console.warn("Unable to create MySQL pool, falling back to in-memory storage.", error.message);
    useMemory = true;
}

function cloneRow(row) {
    return row && typeof row === "object" ? { ...row } : row;
}

function memoryExecute(sql, params = []) {
    const normalized = sql.trim().replace(/\s+/g, " ").toUpperCase();

    if (normalized.startsWith("SELECT * FROM ANIMALS ORDER BY CREATED_AT DESC")) {
        const rows = [...memoryStore.animals]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return [rows.map(cloneRow), []];
    }

    if (normalized.startsWith("SELECT * FROM ANIMALS WHERE ID = ?")) {
        const id = Number(params[0]);
        const row = memoryStore.animals.find((item) => item.id === id) || null;
        return [[row].filter(Boolean).map(cloneRow), []];
    }

    if (normalized.startsWith("INSERT INTO ANIMALS")) {
        const name = params[0];
        const numLegs = Number(params[1] ?? 0);
        const createdBy = params[2] ?? null;
        const createdByName = params[3] ?? null;
        const createdByEmail = params[4] ?? null;
        const newAnimal = {
            id: memoryStore.nextAnimalId++,
            name,
            num_legs: numLegs,
            created_by: createdBy,
            created_by_name: createdByName,
            created_by_email: createdByEmail,
            created_at: new Date().toISOString()
        };
        memoryStore.animals.push(newAnimal);
        return [{ insertId: newAnimal.id }, []];
    }

    if (normalized.startsWith("UPDATE ANIMALS SET")) {
        const id = Number(params[params.length - 1]);
        const animal = memoryStore.animals.find((item) => item.id === id);
        if (animal) {
            animal.name = params[0];
            animal.num_legs = Number(params[1]);
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    if (normalized.startsWith("DELETE FROM ANIMALS WHERE ID = ?")) {
        const id = Number(params[0]);
        const originalLength = memoryStore.animals.length;
        memoryStore.animals = memoryStore.animals.filter((item) => item.id !== id);
        return [{ affectedRows: originalLength - memoryStore.animals.length }, []];
    }

    if (normalized.startsWith("SELECT ID, NAME, EMAIL, PASSWORD_HASH, CREATED_AT FROM USERS WHERE EMAIL = ?")) {
        const email = params[0].toLowerCase();
        const row = memoryStore.users.find((user) => user.email === email) || null;
        return [[row].filter(Boolean).map(cloneRow), []];
    }

    if (normalized.startsWith("SELECT ID, NAME, EMAIL, CREATED_AT FROM USERS WHERE ID = ?")) {
        const id = Number(params[0]);
        const row = memoryStore.users.find((user) => user.id === id) || null;
        return [[row].filter(Boolean).map(cloneRow), []];
    }

    if (normalized.startsWith("INSERT INTO USERS")) {
        const [name, email, passwordHash] = params;
        const newUser = {
            id: memoryStore.nextUserId++,
            name,
            email: email.toLowerCase(),
            password_hash: passwordHash,
            created_at: new Date().toISOString()
        };
        memoryStore.users.push(newUser);
        return [{ insertId: newUser.id }, []];
    }

    if (normalized.startsWith("SELECT 1+1")) {
        return [[{ result: 2 }], []];
    }

    return Promise.reject(new Error(`Unsupported in-memory query: ${sql}`));
}

export async function execute(sql, params = []) {
    if (useMemory) {
        return memoryExecute(sql, params);
    }

    try {
        return await pool.execute(sql, params);
    } catch (error) {
        if (error.code === "ECONNREFUSED" || error.code === "ER_ACCESS_DENIED_ERROR" || error.code === "ER_BAD_DB_ERROR" || error.code === "ENOTFOUND") {
            console.warn("Database unavailable, switching to in-memory storage:", error.message);
            useMemory = true;
            return memoryExecute(sql, params);
        }
        throw error;
    }
}

export {
    pool,
    useMemory
};