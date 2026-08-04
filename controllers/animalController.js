// Import execute from database (not pool)
import { execute } from "../config/database.js";

// ADD THIS - formatAnimal function
function formatAnimal(row) {
    const animal = {
        id: row.id,
        name: row.name,
        numLegs: row.num_legs,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };

    if (row.created_by) {
        animal.createdBy = {
            id: row.created_by,
            name: row.created_by_name || null,
            email: row.created_by_email || null
        };
    }

    return animal;
}

// GET all animals (Public)
export async function getAnimals(req, res) {
    try {
        const [rows] = await execute(
            "SELECT * FROM animals ORDER BY created_at DESC"
        );
        
        const animals = rows.map(formatAnimal);
        
        res.status(200).json(animals);
    } catch (error) {
        console.error("Get animals error:", error);
        res.status(500).json({ 
            message: "Unable to fetch animals" 
        });
    }
}

// GET animal by ID (Public)
export async function getAnimalById(req, res) {
    try {
        const { id } = req.params;
        
        const [rows] = await execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                message: "Animal not found" 
            });
        }
        
        res.status(200).json(formatAnimal(rows[0]));
    } catch (error) {
        console.error("Get animal by id error:", error);
        res.status(500).json({ 
            message: "Unable to fetch animal" 
        });
    }
}

// CREATE animal (Protected - requires JWT)
export async function createAnimal(req, res) {
    console.log("📨 createAnimal called");
    console.log("� Logged-in user:", req.user);
    
    try {
        const { name, numLegs } = req.body;
        
        if (!name) {
            return res.status(400).json({
                message: "Animal name is required"
            });
        }
        
        const userId = req.user?.sub;
        const userName = req.user?.name;
        const userEmail = req.user?.email;
        
        console.log(`✅ Creating animal by user: ${userName} (ID: ${userId})`);
        
        const legs = parseInt(numLegs) || 0;
        
        const [result] = await execute(
            "INSERT INTO animals (name, num_legs, created_by, created_by_name, created_by_email) VALUES (?, ?, ?, ?, ?)",
            [name.trim(), legs, userId, userName, userEmail]
        );
        
        const [newAnimal] = await execute(
            "SELECT * FROM animals WHERE id = ?",
            [result.insertId]
        );
        
        if (newAnimal.length === 0) {
            return res.status(500).json({
                message: "Animal created but could not retrieve it"
            });
        }
        
        res.status(201).json(formatAnimal(newAnimal[0]));
    } catch (error) {
        console.error("Create animal error:", error);
        res.status(500).json({
            message: "Unable to create animal"
        });
    }
}

// UPDATE animal (Protected - requires JWT)
export async function updateAnimal(req, res) {
    try {
        const { id } = req.params;
        const { name, numLegs } = req.body;
        
        // Check if animal exists
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Animal not found"
            });
        }
        
        const updateName = name || existing[0].name;
        const updateNumLegs = numLegs !== undefined ? parseInt(numLegs) : existing[0].num_legs;
        
        await execute(
            "UPDATE animals SET name = ?, num_legs = ? WHERE id = ?",
            [updateName, updateNumLegs, id]
        );
        
        const [updated] = await execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );
        
        res.status(200).json(formatAnimal(updated[0]));
    } catch (error) {
        console.error("Update animal error:", error);
        res.status(500).json({
            message: "Unable to update animal"
        });
    }
}

// DELETE animal (Protected - requires JWT)
export async function deleteAnimal(req, res) {
    try {
        const { id } = req.params;
        
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Animal not found"
            });
        }
        
        await execute(
            "DELETE FROM animals WHERE id = ?",
            [id]
        );
        
        res.status(200).json({
            message: "Animal deleted successfully"
        });
    } catch (error) {
        console.error("Delete animal error:", error);
        res.status(500).json({
            message: "Unable to delete animal"
        });
    }
}