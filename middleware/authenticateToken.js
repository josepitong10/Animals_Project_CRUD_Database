import jwt from "jsonwebtoken";

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token is required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ✅ IMPORTANT: Kunin ang user ID mula sa token
        req.user = {
            id: parseInt(decoded.id || decoded.sub),
            name: decoded.name,
            email: decoded.email
        };
        
        console.log(`✅ Authenticated: ${req.user.name} (ID: ${req.user.id})`);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}