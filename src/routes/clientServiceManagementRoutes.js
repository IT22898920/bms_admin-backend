const express = require("express");
const { createClientService, getAllClientServices, deleteClientService, updateClientServiceStatus, sendServiceFormEmail, createClientServiceUnregister, getUnregisteredClientServices, sendServiceFormUnregisterEmail } = require("../controllers/clientServiceManagementController");
const { protect, adminOnly } = require("../middlewares/authhMiddleware");

const router = express.Router();

// Create a new client service
router.post("/create", protect , createClientService);
router.post("/create-unregister", createClientServiceUnregister);

router.get("/get-all", protect,adminOnly, getAllClientServices);

router.get(
  "/get-unregistered",
  protect,
  adminOnly,
  getUnregisteredClientServices
);

// Delete a client service by ID
router.delete("/:id", protect, adminOnly, deleteClientService);

// Update client service status by ID
router.patch("/update-status/:id", protect, updateClientServiceStatus);

router.post("/send-service-form", protect, adminOnly, sendServiceFormEmail);

router.post(
  "/send-service-form-unregister",
  protect,
  adminOnly,
  sendServiceFormUnregisterEmail
);


module.exports = router;
