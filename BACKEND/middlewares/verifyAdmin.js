const User = require("../models/User");

/**
 * Middleware: Verify the authenticated user is an active admin.
 * Must be used AFTER verifyToken middleware (requires req.userId).
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("isAdmin isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated.",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    console.error("verifyAdmin error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = verifyAdmin;
