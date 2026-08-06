import "dotenv/config";
import express from "express";
import cors from "cors"; // ✅ I-install ito: npm install cors
import authRoutes from "./routes/authRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";

const app = express();

// ✅ CORS - para makapag-connect ang frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.options('*', cors());

// ✅ Para ma-parse ang JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the Task API",
        routes: ["/auth/register", "/auth/login", "/animals"]
    });
});

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/animals", animalRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});