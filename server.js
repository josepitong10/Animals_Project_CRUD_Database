import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";

const app = express();

// Middleware
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
    console.log(`Server running on http://localhost:${port}`);
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Set PORT to another value or stop the process using that port.`);
    } else {
        console.error("Server error:", error);
    }
    process.exit(1);
});