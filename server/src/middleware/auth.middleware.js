/**
 * Authentication Middleware (protectRoute)
 * ---------------------------------------
 * This middleware protects private API routes by verifying
 * a JSON Web Token (JWT) stored in an HTTP-only cookie.
 *
 * If authentication succeeds, the authenticated user
 * is attached to the request object for downstream handlers.
 */
const jwt = require("jsonwebtoken");
const User = require('../models/user.model');

/**
 * Protects routes that require authentication.
 * This middleware:
 * - Extracts the JWT from cookies
 * - Verifies the token signature and expiration
 * - Loads the authenticated user from the database
 * - Attaches the user to the request object
 */
const protectRoute = async (req, res, next)=>{
  try {
    const token = req.cookies.pedaTrain;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log("Error in protectRoute middleware:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = protectRoute;
