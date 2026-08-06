import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const BCRYPT_ROUNDS = 12;

export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedEmail) {
            return res.status(400).json({
                message: "Name and email cannot be empty"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters"
            });
        }

        const existingUser = await User.findByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(409).json({ // ✅ Changed to 409 Conflict
                message: "Email is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        return res.status(500).json({
            message: "Unable to register user"
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // ✅ FIX: Include user ID in the JWT payload
        const accessToken = jwt.sign(
            { 
                id: user.id,        // ✅ Include ID in payload
                name: user.name, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { 
                subject: String(user.id), // Also keep as subject
                expiresIn: process.env.JWT_EXPIRES_IN || "24h" // Changed to 24h
            }
        );

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Unable to log in"
        });
    }
}