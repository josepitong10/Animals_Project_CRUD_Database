import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import {
    getAnimals,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    // getAllAnimalsAdmin // Optional for admin
} from "../controllers/animalController.js";

const router = express.Router();

// ✅ LAHAT ng routes ay nangangailangan ng authentication
router.use(authenticateToken);

// ✅ GET - Tanging hayop ng logged-in user
router.get("/", getAnimals);

// ✅ GET by ID - Tanging kung pag-aari ng user
router.get("/:id", getAnimalById);

// ✅ POST - Gumawa ng hayop (auto-assign sa user)
router.post("/", createAnimal);

// ✅ PUT - I-update lamang kung pag-aari
router.put("/:id", updateAnimal);

// ✅ DELETE - I-delete lamang kung pag-aari
router.delete("/:id", deleteAnimal);

// Optional: Admin route to see all animals
// router.get("/admin/all", authenticateToken, getAllAnimalsAdmin);

export default router;