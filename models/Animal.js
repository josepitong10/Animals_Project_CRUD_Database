import { execute } from "../config/database.js";

function formatAnimal(row) {
    return {
        id: row.id,
        name: row.name,
        numLegs: row.num_legs,
        createdAt: row.created_at
    };
}

// Get all animals
export async function getAnimals(numLegs) {
    let sqlQuery = "SELECT * FROM animals";
    const params = [];

    if (numLegs) {
        sqlQuery += " WHERE num_legs = ?";
        params.push(Number(numLegs));
    }

    const [rows] = await execute(sqlQuery, params);
    return rows.map(formatAnimal);
}

// Get animal by ID
export async function getAnimalById(id) {
    const [rows] = await execute(
        "SELECT * FROM animals WHERE id = ?",
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return formatAnimal(rows[0]);
}

// Create animal
export async function createAnimal(id, name, numLegs) {
    let insertQuery = "INSERT INTO animals (name, num_legs";
    let insertValues = "VALUES (?, ?";
    let params = [name.toUpperCase(), Number(numLegs ?? 0)];

    if (id) {
        insertQuery += ", id";
        insertValues += ", ?";
        params.push(Number(id));
    }

    insertQuery += ") " + insertValues + ")";

    const [result] = await execute(insertQuery, params);

    return result.insertId || id;
}

// Update animal
export async function updateAnimal(id, name, numLegs) {
    let updates = [];
    let params = [];

    if (name) {
        updates.push("name = ?");
        params.push(name.toUpperCase());
    }

    if (numLegs !== undefined) {
        updates.push("num_legs = ?");
        params.push(Number(numLegs));
    }

    if (updates.length === 0) {
        return false;
    }

    params.push(id);

    await execute(
        `UPDATE animals SET ${updates.join(", ")} WHERE id = ?`,
        params
    );

    return true;
}

// Delete animal
export async function deleteAnimal(id) {
    const [result] = await execute(
        "DELETE FROM animals WHERE id = ?",
        [id]
    );

    return result.affectedRows;
}
