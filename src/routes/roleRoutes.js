const express = require("express");
const {
  createRole,
  getRoles,
  deleteRole,
  updateRole,
} = require("../controllers/roleController");
const { protect, adminOnly } = require("../middlewares/authhMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createRole); // Create a new role
router.get("/", protect, adminOnly, getRoles); // Get all roles
router.delete("/:id", protect, adminOnly, deleteRole); // Delete a role
router.patch("/:id", protect, adminOnly, updateRole);

module.exports = router;
