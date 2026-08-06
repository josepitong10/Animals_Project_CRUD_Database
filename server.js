import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";

const app = express();

// ✅ Manual CORS Middleware
app.use((req, res, next) => {
    // Allow all origins
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Allow specific methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    // Allow specific headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    
    // Allow credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Cache preflight results for 1 hour
    res.setHeader('Access-Control-Max-Age', '3600');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

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

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use.`);
    } else {
        console.error("❌ Server error:", error);
    }
    process.exit(1);
});