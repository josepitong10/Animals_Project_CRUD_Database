import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import {
    getAnimals,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    getAnimalsByUser
} from "../controllers/animalController.js";

const router = express.Router();

// ✅ All routes require authentication for private access
router.use(authenticateToken);

// GET all animals (filtered by user)
router.get("/", getAnimals);

// GET animal by ID (check ownership)
router.get("/:id", getAnimalById);

// GET animals by user ID (only own)
router.get("/user/:userId", getAnimalsByUser);

// POST create animal
router.post("/", createAnimal);

// PUT update animal
router.put("/:id", updateAnimal);

// DELETE animal
router.delete("/:id", deleteAnimal);

export default router;