const asyncHandler = require("express-async-handler");
const Role = require("../models/Role");
const Notification = require("../models/notificationModel"); // <-- Import Notification model

// Create a Role
const createRole = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Role name is required");
  }

  // Check if this role name already exists
  const roleExists = await Role.findOne({ name });
  if (roleExists) {
    res.status(400);
    throw new Error("Role already exists");
  }

  // Create the new role
  const role = await Role.create({ name });

  // Create a notification for the admin (or whoever is in req.user)
  try {
    await Notification.create({
      userId: req.user._id, // e.g. the admin user who created the role
      message: `A new role "${role.name}" was created.`,
    });
  } catch (notificationError) {
    console.error("Error creating notification for role creation:", notificationError);
    // You might choose not to throw an error here if you want role creation to succeed anyway.
  }

  res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: role,
  });
});

// Get All Roles
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find();
  res.status(200).json({
    success: true,
    message: "Roles retrieved successfully",
    data: roles,
  });
});

// Delete a Role
const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1) Check if role exists
  const role = await Role.findById(id);
  if (!role) {
    res.status(404);
    throw new Error("Role not found");
  }

  // 2) Delete it
  await role.deleteOne();

  // 3) Create a notification
  try {
    await Notification.create({
      userId: req.user._id, // The user who performed the deletion
      message: `The role "${role.name}" was deleted.`,
    });
  } catch (notificationError) {
    console.error("Error creating notification (deleteRole):", notificationError);
  }

  res.status(200).json({
    success: true,
    message: "Role deleted successfully",
  });
});

// Update Role
const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Role name is required");
  }

  // 1) Check if role exists
  const role = await Role.findById(id);
  if (!role) {
    res.status(404);
    throw new Error("Role not found");
  }

  const oldName = role.name; // If you want to note the old name in your message

  // 2) Update the name
  role.name = name;
  await role.save();

  // 3) Create a notification
  try {
    await Notification.create({
      userId: req.user._id, // The user who performed the update
      message: `Role "${oldName}" has been renamed to "${role.name}".`,
    });
  } catch (notificationError) {
    console.error("Error creating notification (updateRole):", notificationError);
  }

  res.status(200).json({
    message: "Role updated successfully",
    data: role,
  });
});

module.exports = {
  createRole,
  getRoles,
  deleteRole,
  updateRole,
};
