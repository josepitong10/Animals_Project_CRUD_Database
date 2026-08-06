import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import {
    getAnimals,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal
} from "../controllers/animalController.js";

const router = express.Router();

// ✅ LAHAT ng routes dito ay kailangan ng authentication
router.use(authenticateToken);

// GET - only the logged-in user's animals
router.get("/", getAnimals);

// GET by ID - only if it belongs to the user
router.get("/:id", getAnimalById);

// POST - create animal (automatically assigned to user)
router.post("/", createAnimal);

// PUT - update only if it belongs to the user
router.put("/:id", updateAnimal);

// DELETE - delete only if it belongs to the user
router.delete("/:id", deleteAnimal);

export default router;