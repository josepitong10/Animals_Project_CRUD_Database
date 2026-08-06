import { execute } from "../config/database.js";

function formatAnimal(row) {
    return {
        id: row.id,
        name: row.name,
        numLegs: row.num_legs,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by ? {
            id: row.created_by,
            name: row.created_by_name || null,
            email: row.created_by_email || null
        } : null
    };
}

// ✅ IMPORTANT: Ito ang dapat mag-filter ng animals ayon sa user
export async function getAnimals(req, res) {
    try {
        // ✅ Siguraduhing may authenticated user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }

        console.log(`🔍 Fetching animals for user: ${req.user.id}`);

        // ✅ ITO ANG IMPORTANTE: Magdagdag ng WHERE clause para i-filter ang animals
        const [rows] = await execute(
            "SELECT * FROM animals WHERE created_by = ? ORDER BY created_at DESC",
            [req.user.id]  // ✅ Tanging hayop ng logged-in user lang
        );
        
        console.log(`📦 Found ${rows.length} animals for user ${req.user.id}`);
        
        const animals = rows.map(formatAnimal);
        res.status(200).json(animals);
    } catch (error) {
        console.error("❌ Get animals error:", error);
        res.status(500).json({ 
            message: "Unable to fetch your animals" 
        });
    }
}

// GET animal by ID - ONLY if it belongs to the user
export async function getAnimalById(req, res) {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }
        
        // ✅ I-filter ayon sa user ID
        const [rows] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                message: "Animal not found or you don't have permission" 
            });
        }
        
        res.status(200).json(formatAnimal(rows[0]));
    } catch (error) {
        console.error("❌ Get animal error:", error);
        res.status(500).json({ 
            message: "Unable to fetch animal" 
        });
    }
}

// CREATE - auto-assign sa logged-in user
export async function createAnimal(req, res) {
    try {
        const { name, numLegs } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                message: "Animal name is required" 
            });
        }
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }
        
        const userId = req.user.id;
        const userName = req.user.name;
        const userEmail = req.user.email;
        const legs = parseInt(numLegs) || 0;
        
        console.log(`✅ ${userName} (ID: ${userId}) is creating an animal`);
        
        // ✅ I-save ang created_by para malaman kung sino ang may-ari
        const [result] = await execute(
            "INSERT INTO animals (name, num_legs, created_by, created_by_name, created_by_email) VALUES (?, ?, ?, ?, ?)",
            [name.trim(), legs, userId, userName, userEmail]
        );
        
        // ✅ Kunin ang bagong animal at i-verify na sa user ito
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
        console.error("❌ Create animal error:", error);
        res.status(500).json({ 
            message: "Unable to create animal" 
        });
    }
}

// UPDATE - ONLY if it belongs to the user
export async function updateAnimal(req, res) {
    try {
        const { id } = req.params;
        const { name, numLegs } = req.body;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }
        
        // ✅ I-verify na ang hayop ay pag-aari ng user
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                message: "Animal not found or you don't have permission" 
            });
        }
        
        const updateName = name || existing[0].name;
        const updateNumLegs = numLegs !== undefined ? parseInt(numLegs) : existing[0].num_legs;
        
        // ✅ I-update lamang kung pag-aari ng user
        await execute(
            "UPDATE animals SET name = ?, num_legs = ? WHERE id = ? AND created_by = ?",
            [updateName, updateNumLegs, id, req.user.id]
        );
        
        const [updated] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        res.status(200).json(formatAnimal(updated[0]));
    } catch (error) {
        console.error("❌ Update animal error:", error);
        res.status(500).json({ 
            message: "Unable to update animal" 
        });
    }
}

// DELETE - ONLY if it belongs to the user
export async function deleteAnimal(req, res) {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                message: "Authentication required" 
            });
        }
        
        // ✅ I-verify na ang hayop ay pag-aari ng user
        const [existing] = await execute(
            "SELECT * FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                message: "Animal not found or you don't have permission" 
            });
        }
        
        // ✅ I-delete lamang kung pag-aari ng user
        await execute(
            "DELETE FROM animals WHERE id = ? AND created_by = ?",
            [id, req.user.id]
        );
        
        res.status(200).json({ 
            message: "Animal deleted successfully" 
        });
    } catch (error) {
        console.error("❌ Delete animal error:", error);
        res.status(500).json({ 
            message: "Unable to delete animal" 
        });
    }
}

// ✅ Optional: Get all animals (admin only) - kung kailangan
export async function getAllAnimalsAdmin(req, res) {
    try {
        // Optional: Check if user is admin
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ message: "Admin access required" });
        // }
        
        const [rows] = await execute(
            "SELECT * FROM animals ORDER BY created_at DESC"
        );
        res.status(200).json(rows.map(formatAnimal));
    } catch (error) {
        console.error("❌ Get all animals error:", error);
        res.status(500).json({ 
            message: "Unable to fetch animals" 
        });
    }
}