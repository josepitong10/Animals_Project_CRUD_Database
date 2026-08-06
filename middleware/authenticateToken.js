import jwt from "jsonwebtoken";

export default function authenticateToken(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    // Check if Authorization header exists and has Bearer token
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token is required"
        });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authorizationHeader.split(" ")[1];

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // ✅ Ensure user object has all required fields
        req.user = {
            id: parseInt(decodedToken.id || decodedToken.sub), // Use id or sub
            name: decodedToken.name,
            email: decodedToken.email,
            ...decodedToken // Keep any other fields
        };
        
        console.log(`✅ Authenticated user: ${req.user.name} (ID: ${req.user.id})`);
        next();
    } catch (error) {
        console.error("❌ Authentication error:", error.message);
        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
}