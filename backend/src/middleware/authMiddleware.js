const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// ----------- PROTECT MIDDLEWARE ------------------
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // Ensure Auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    // Validate token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach user to request
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ message: "User account is disabled" });
    }

    next();
  } catch (err) {
    console.error("Token error:", err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
});

// ----------- ADMIN MIDDLEWARE ------------------
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

module.exports = { protect, admin };
