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

// Public routes (no authentication required)
router.get("/", getAnimals);
router.get("/:id", getAnimalById);

// Protected routes (authentication required)
router.post("/", authenticateToken, createAnimal);
router.put("/:id", authenticateToken, updateAnimal);
router.delete("/:id", authenticateToken, deleteAnimal);

export default router;