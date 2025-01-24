const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const RolesTask = require("../models/asignRole&TaskModel");  
const User = require("../models/userModel");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect, adminOnly } = require("../middlewares/authhMiddleware");
const Role = require("../models/Role"); // Assuming roles are stored in a separate schema



// Create Role & Task Endpoint
router.post(
  "/create-role-task",
  protect, // Ensure the user is authenticated
  adminOnly, // Only allow admin users
  asyncHandler(async (req, res) => {
    const { email, role, taskDescription, startDate, dueDate, priority } =
      req.body;

    // Validation
    if (
      !email ||
      !role ||
      !taskDescription ||
      !startDate ||
      !dueDate ||
      !priority
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }

    // Create Role & Task
    const roleTask = await RolesTask.create({
      email,
      role,
      taskDescription,
      startDate,
      dueDate,
      priority,
    });

    res.status(201).json({
      message: "Role & Task created successfully",
      roleTask,
    });
  })
);


router.put(
  "/update-role-task/:id",
  protect, // Authentication middleware
  adminOnly, // Authorization middleware
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, email, taskDescription, startDate, dueDate, priority } =
      req.body;

    // Find the Role & Task by ID
    const roleTask = await RolesTask.findById(id);
    if (!roleTask) {
      res.status(404);
      throw new Error("Role & Task not found");
    }

    // Update the Role & Task
    roleTask.role = role || roleTask.role;
    roleTask.taskDescription = taskDescription || roleTask.taskDescription;
    roleTask.startDate = startDate || roleTask.startDate;
    roleTask.dueDate = dueDate || roleTask.dueDate;
    roleTask.priority = priority || roleTask.priority;

    // Save changes and trigger middleware
    const updatedRoleTask = await roleTask.save();

    res.status(200).json({
      message: "Role & Task updated successfully",
      data: updatedRoleTask,
    });
  })
);


// Get All Roles & Tasks
router.get(
  "/get-all-role-tasks",
  protect, // Ensure the user is authenticated
  adminOnly, // Restrict access to admin users
  asyncHandler(async (req, res) => {
    try {
      const roleTasks = await RolesTask.find(); // Retrieve all documents from the Roles&Task collection
      res.status(200).json({
        message: "Roles & Tasks retrieved successfully",
        data: roleTasks,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to retrieve roles & tasks",
        error: error.message,
      });
    }
  })
);

// Delete Role & Task by ID
router.delete(
  "/delete-role-task/:id",
  protect, // Ensure the user is authenticated
  adminOnly, // Restrict access to admin users
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const roleTask = await RolesTask.findById(id);

      if (!roleTask) {
        res.status(404);
        throw new Error("Role & Task not found");
      }

      await roleTask.deleteOne(); // Delete the document
      res.status(200).json({
        message: "Role & Task deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete Role & Task",
        error: error.message,
      });
    }
  })
);



router.put(
  "/update-role-task/:id",
  protect, // Ensure authentication
  adminOnly, // Only admin can update
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email,  taskDescription, startDate, dueDate, priority } =
      req.body;

    const roleTask = await RolesTask.findById(id);

    if (!roleTask) {
      res.status(404);
      throw new Error("Role & Task not found");
    }

    roleTask.email = email || roleTask.email;
    roleTask.taskDescription = taskDescription || roleTask.taskDescription;
    roleTask.startDate = startDate || roleTask.startDate;
    roleTask.dueDate = dueDate || roleTask.dueDate;
    roleTask.priority = priority || roleTask.priority;

    const updatedRoleTask = await roleTask.save();
    res
      .status(200)
      .json({
        message: "Role & Task updated successfully",
        data: updatedRoleTask,
      });
  })
);
// Fetch all roles
router.get(
  "/roles",
  asyncHandler(async (req, res) => {
    try {
      const roles = await Role.find();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch roles",
        error: error.message,
      });
    }
  })
);

module.exports = router;
