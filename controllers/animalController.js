// Import execute from database (not pool)
import { execute } from "../config/database.js";

// formatAnimal function
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

// ✅ GET all animals (Public - but filtered by user if authenticated)
export async function getAnimals(req, res) {
    try {
        let query = "SELECT * FROM animals ORDER BY created_at DESC";
        let params = [];
        
        // If user is authenticated, only show their animals
        if (req.user && req.user.id) {
            query = "SELECT * FROM animals WHERE created_by = ? ORDER BY created_at DESC";
            params = [req.user.id];
        }
        // If no user, return empty array or all animals (depending on your preference)
        // For private mode, we'll return empty array if not authenticated
        
        const [rows] = await execute(query, params);
        const animals = rows.map(formatAnimal);
        
        res.status(200).json(animals);
    } catch (error) {
        console.error("Get animals error:", error);
        res.status(500).json({ 
            message: "Unable to fetch animals" 
        });
    }
}

// GET animal by ID (Public - but check ownership)
export async function getAnimalById(req, res) {
    try {
        const { id } = req.params;
        
        let query = "SELECT * FROM animals WHERE id = ?";
        let params = [id];
        
        // If user is authenticated, check ownership
        if (req.user && req.user.id) {
            query = "SELECT * FROM animals WHERE id = ? AND created_by = ?";
            params = [id, req.user.id];
        }
        
        const [rows] = await execute(query, params);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                message: "Animal not found or you don't have permission to view it" 
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

// ✅ CREATE animal (Protected - requires JWT)
export async function createAnimal(req, res) {
    console.log("📨 createAnimal called");
    console.log("🔐 Logged-in user:", req.user);
    
    try {
        const { name, numLegs } = req.body;
        
        if (!name) {
            return res.status(400).json({
                message: "Animal name is required"
            });
        }
        
        // ✅ Must be authenticated to create
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required to create animals"
            });
        }
        
        const userId = req.user.id;
        const userName = req.user.name;
        const userEmail = req.user.email;
        
        console.log(`✅ Creating animal by user: ${userName} (ID: ${userId})`);
        
        const legs = parseInt(numLegs) || 0;
        
        const [result] = await execute(
            "INSERT INTO animals (name, num_legs, created_by, created_by_name, created_by_email) VALUES (?, ?, ?, ?, ?)",
            [name.trim(), legs, userId, userName, userEmail]
        );
        
        const [newAnimal] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [result.insertId, userId]
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

// ✅ UPDATE animal (Protected - requires JWT and ownership)
export async function updateAnimal(req, res) {
    try {
        const { id } = req.params;
        const { name, numLegs } = req.body;
        
        // Must be authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required to update animals"
            });
        }
        
        // Check if animal exists and belongs to the user
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Animal not found or you don't have permission to update it"
            });
        }
        
        const updateName = name || existing[0].name;
        const updateNumLegs = numLegs !== undefined ? parseInt(numLegs) : existing[0].num_legs;
        
        await execute(
            "UPDATE animals SET name = ?, num_legs = ? WHERE id = ? AND created_by = ?",
            [updateName, updateNumLegs, id, req.user.id]
        );
        
        const [updated] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (updated.length === 0) {
            return res.status(404).json({
                message: "Animal not found after update"
            });
        }
        
        res.status(200).json(formatAnimal(updated[0]));
    } catch (error) {
        console.error("Update animal error:", error);
        res.status(500).json({
            message: "Unable to update animal"
        });
    }
}

// ✅ DELETE animal (Protected - requires JWT and ownership)
export async function deleteAnimal(req, res) {
    try {
        const { id } = req.params;
        
        // Must be authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required to delete animals"
            });
        }
        
        // Check if animal exists and belongs to the user
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Animal not found or you don't have permission to delete it"
            });
        }
        
        await execute(
            "DELETE FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
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

// ✅ Get animals by user ID (for admin or debugging)
export async function getAnimalsByUser(req, res) {
    try {
        const { userId } = req.params;
        
        // Optional: Check if requesting user is admin or the same user
        // For now, only allow if authenticated and matches
        if (!req.user || req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                message: "You can only view your own animals"
            });
        }
        
        const [rows] = await execute(
            "SELECT * FROM animals WHERE created_by = ? ORDER BY created_at DESC",
            [userId]
        );
        
        const animals = rows.map(formatAnimal);
        res.status(200).json(animals);
    } catch (error) {
        console.error("Get animals by user error:", error);
        res.status(500).json({
            message: "Unable to fetch user's animals"
        });
    }
}