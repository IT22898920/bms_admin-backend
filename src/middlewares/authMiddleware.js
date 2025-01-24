const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header is present and starts with "Bearer"
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]; // Extract token

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user data to the request object
      req.user = decoded;

      console.log("User verified:", req.user); // Development use only
      next(); // Proceed to the next middleware
    } catch (error) {
      console.error("JWT verification failed:", error.message); // Log the error
      return res.status(403).json({ message: "Invalid token, access forbidden" });
    }
  } else {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }
};

module.exports = verifyToken;
