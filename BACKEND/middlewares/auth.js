const jwt = require("jsonwebtoken");

/**
 * Middleware: Verify JWT token from Authorization header.
 * Sets req.userId on success.
 */
const verifyToken = (req, res, next) => {
  // Support both "Bearer <token>" and raw token formats
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Unauthenticated. No token provided.",
    });
  }

  // Strip "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthenticated. Empty token.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
