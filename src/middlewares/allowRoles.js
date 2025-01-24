const express = require("express");
const {
  protect,
  allowRoles,
  adminOnly,
} = require("../middlewares/authhMiddleware");
const router = express.Router();

// Admin-only route
router.get("/admin", protect, adminOnly,allowRoles("admin"), (req, res) => {
  res.send("Welcome Admin");
});

// KYC Management-only route
router.get("/kyc", protect, allowRoles("KYC_Management"), (req, res) => {
  res.send("Welcome KYC Manager");
});

// Multiple roles allowed
router.get(
  "/shared",
  protect,
  allowRoles("admin", "KYC_Management"),
  (req, res) => {
    res.send("Welcome Admin or KYC Manager");
  }
);

module.exports = router;
