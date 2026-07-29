require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, formatAnimal } = require("./database");
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());


app.get("/", (request, response) => {
    response.json({
        message: "Animal API is running with Database",
    });
});

// Get all animals with optional filter
const getAnimals = async (req, res) => {
    try {
        const query = req.query;
        let sqlQuery = "SELECT * FROM animals";
        const params = [];

        if (query.numLegs) {
            sqlQuery += " WHERE num_legs = ?";
            params.push(Number(query.numLegs));
        }

        const [rows] = await pool.execute(sqlQuery, params);
        const formattedAnimals = rows.map(formatAnimal);

        res.json({
            animals: formattedAnimals
        });
    } catch (error) {
        console.error("Error fetching animals:", error);
        res.status(500).json({
            message: "Unable to retrieve animals"
        });
    }
};

// Get a single animal by ID
app.get("/animals/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Animal not found"
            });
        }

        res.json(formatAnimal(rows[0]));
    } catch (error) {
        console.error("Error fetching animal:", error);
        res.status(500).json({
            message: "Unable to retrieve animal"
        });
    }
});

// Add a new animal
const addAnimal = async (req, res) => {
    try {
        const { id, name, numLegs, numLeg } = req.body;

        if (!name || (numLegs === undefined && numLeg === undefined)) {
            return res.status(400).json({
                message: "name and numLegs are required"
            });
        }

        const legs = Number(numLegs ?? numLeg);
        const animalName = name.toUpperCase();

        let insertQuery = "INSERT INTO animals (name, num_legs";
        let insertValues = "VALUES (?, ?";
        let params = [animalName, legs];

        if (id) {
            insertQuery += ", id";
            insertValues += ", ?";
            params.push(Number(id));
        }

        insertQuery += ") " + insertValues + ")";

        const [result] = await pool.execute(insertQuery, params);

        const [rows] = await pool.execute(
            "SELECT * FROM animals WHERE id = ?",
            [result.insertId || id]
        );

        return res.status(201).json({
            message: "Animal added successfully",
            animal: formatAnimal(rows[0])
        });
    } catch (error) {
        console.error("Error adding animal:", error);
        res.status(500).json({
            message: "Unable to add animal"
        });
    }
};

// Update an animal
app.put("/animals/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, numLegs } = req.body;

        const [existing] = await pool.execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Animal not found"
            });
        }

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
            return res.status(400).json({
                message: "No fields to update"
            });
        }

        params.push(id);
        await pool.execute(
            `UPDATE animals SET ${updates.join(", ")} WHERE id = ?`,
            params
        );

        const [rows] = await pool.execute(
            "SELECT * FROM animals WHERE id = ?",
            [id]
        );

        res.json({
            message: "Animal updated successfully",
            animal: formatAnimal(rows[0])
        });
    } catch (error) {
        console.error("Error updating animal:", error);
        res.status(500).json({
            message: "Unable to update animal"
        });
    }
});

// Delete an animal
app.delete("/animals/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.execute(
            "DELETE FROM animals WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Animal not found"
            });
        }

        res.json({
            message: "Animal deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting animal:", error);
        res.status(500).json({
            message: "Unable to delete animal"
        });
    }
});

// Routes
app.get("/animals", getAnimals);
app.post("/animals", addAnimal);

async function startServer() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to MySQL successfully");
        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Unable to connect to MySQL:", error.message);
        process.exit(1);
    }
}

startServer();