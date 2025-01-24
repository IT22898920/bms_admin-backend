// security&privacyRoutes.js

const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const RolesTask = require("../models/asignRole&TaskModel");
const User = require("../models/userModel"); // Import the User model

const router = express.Router();

// Route to retrieve only name and roles
router.get(
  "/retrieve-roles-tasks",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Fetch name and roles from RolesTask
      const rolesTasks = await RolesTask.find({}, "name roles");

      res.status(200).json({
        status: "success",
        message: "Roles and tasks retrieved successfully.",
        data: rolesTasks,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

// Route to edit a user's role
router.put(
  "/update-role-task/:id",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { roles } = req.body;

    try {
      // Validate input
      if (!roles) {
        return res.status(400).json({
          status: "error",
          message: "Name and roles are required.",
        });
      }

      // Find and update the document
      const updatedRoleTask = await RolesTask.findByIdAndUpdate(
        id,
        { roles },
        { new: true } // Return the updated document
      );

      if (!updatedRoleTask) {
        return res.status(404).json({
          status: "error",
          message: "Role task not found.",
        });
      }

      res.status(200).json({
        status: "success",
        message: "Roles and tasks updated successfully.",
        data: updatedRoleTask,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

// Route to revoke a user's access in detailed
// router.delete(
//     "/revoke-role-task/:id",
//     verifyToken,
//     authorizeRoles("admin"),
//     async (req, res) => {
//       const { id } = req.params;

//       try {
//         // Find and delete the document by ID
//         const revokedRoleTask = await RolesTask.findByIdAndDelete(id);

//         if (!revokedRoleTask) {
//           return res.status(404).json({
//             status: "error",
//             message: "Role task not found.",
//           });
//         }

//         res.status(200).json({
//           status: "success",
//           message: "Role task revoked successfully.",
//           data: revokedRoleTask,
//         });
//       } catch (error) {
//         res.status(500).json({
//           status: "error",
//           message: "An unexpected error occurred.",
//           error: error.message,
//         });
//       }
//     }
//   );

// Route to revoke a user's access
router.delete(
  "/revoke-role-task/:id",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      // Check if the document exists and delete it
      const revokedRoleTask = await RolesTask.findByIdAndDelete(id);

      if (!revokedRoleTask) {
        return res.status(404).json({
          status: "error",
          message: "Role task not found.",
        });
      }

      // Respond with a success message
      res.status(200).json({
        status: "success",
        message: "Role task revoked successfully.",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
