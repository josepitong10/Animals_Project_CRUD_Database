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
        
        // ✅ FIX: Map the JWT claims to a consistent user object
        req.user = {
            id: decodedToken.sub, // 'sub' contains the user ID
            name: decodedToken.name,
            email: decodedToken.email,
            ...decodedToken // Keep any other fields
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
}