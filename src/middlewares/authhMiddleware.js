const asyncHandler = require("express-async-handler");
const User = require("../models/clientModel");
const jwt = require("jsonwebtoken");

// Middleware to protect routes by ensuring the user is authenticated
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user; // Attach user details to the request
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

// Middleware for admin-only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
};

// Middleware to allow specific manager roles
const allowManagers = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      throw new Error(
        `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
      );
    }
  };
};

module.exports = {
  protect,
  adminOnly,
  allowManagers,
};
