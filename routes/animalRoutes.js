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

// ✅ ALL routes require authentication (private access only)
router.use(authenticateToken);

// GET all animals (only the logged-in user's animals)
router.get("/", getAnimals);

// GET animal by ID (only if it belongs to the user)
router.get("/:id", getAnimalById);

// GET animals by user ID (only if it's the logged-in user)
router.get("/user/:userId", getAnimalsByUser);

// POST create animal (authenticated user)
router.post("/", createAnimal);

// PUT update animal (only if it belongs to the user)
router.put("/:id", updateAnimal);

// DELETE animal (only if it belongs to the user)
router.delete("/:id", deleteAnimal);

export default router;