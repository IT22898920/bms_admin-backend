// Middleware to authorize user roles
// const authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     try {
//       // Ensure user data is available in the request object
//       if (!req.user || !req.user.role) {
//         console.error("Access denied: User data is missing.");
//         return res.status(403).json({
//           message: "User data not found. Access denied.",
//         });
//       }

//       const userRole = req.user.role;

//       // Check if the user's role is in the list of allowed roles
//       if (!allowedRoles.includes(userRole)) {
//         console.error(
//           `Access denied: User role '${userRole}' does not have sufficient permissions. Allowed roles: [${allowedRoles.join(", ")}]`
//         );
//         return res.status(403).json({
//           message: "Access denied. Insufficient permissions.",
//         });
//       }

//       // User is authorized
//       next();
//     } catch (error) {
//       console.error("Error in role authorization middleware:", error.message);
//       res.status(500).json({
//         message: "Internal server error during role authorization.",
//       });
//     }
//   };
// };

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user data is available in the request object
      if (!req.user || !req.user.role) {
        console.error(`Access denied: User data is missing on ${req.originalUrl}`);
        return res.status(403).json({
          message: "User data not found. Access denied.",
        });
      }

      const userRole = req.user.role;

      // Check if the user's role is in the list of allowed roles
      if (!allowedRoles.includes(userRole)) {
        console.error(`Access denied: User role '${userRole}' does not have sufficient permissions for ${req.originalUrl}`);
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      // User is authorized
      next();
    } catch (error) {
      console.error("Error in role authorization middleware:", error.message);
      res.status(500).json({
        message: "Internal server error during role authorization.",
      });
    }
  };
};


module.exports = authorizeRoles;
