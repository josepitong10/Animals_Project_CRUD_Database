import "dotenv/config";
import express from "express";
import cors from "cors"; // ✅ Add this import
import authRoutes from "./routes/authRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";

const app = express();

// ✅ CORS Configuration - MUST be before any routes
app.use(cors({
    origin: '*', // Allow all origins (for development)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// ✅ Handle preflight requests for all routes
app.options('*', cors());

// Middleware - Parse JSON bodies
app.use(express.json());

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the Task API",
        routes: ["/auth/register", "/auth/login", "/animals"]
    });
});

// Route modules
app.use("/auth", authRoutes);
app.use("/animals", animalRoutes);

//  Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(` Server running on http://localhost:${port}`);
    console.log(` CORS enabled for all origins`);
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(` Port ${port} is already in use. Set PORT to another value or stop the process using that port.`);
    } else {
        console.error(" Server error:", error);
    }
    process.exit(1);
});