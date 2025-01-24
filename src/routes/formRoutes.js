const express = require("express");

const { protect, adminOnly } = require("../middlewares/authhMiddleware");
const {
  createForm,
  getForms,
  getFormById,
  deleteForm,
  updateForm,
  getServiceDetails,
  getServiceNames,
  sendFormToClient,
  sendFormWithDetails,
  getFormPreview,
  getClientServices,
  getServiceNamesUnregister,
} = require("../controllers/formController");

const router = express.Router();

// Define specific routes first
// Get all service names
router.get("/service-names", protect, getServiceNames);
router.get("/service-names-unregister", getServiceNamesUnregister);

// Create a new form
router.post("/create", protect, adminOnly, createForm);

// Get all forms
router.get("/all", protect, adminOnly, getForms);

// Get service details by ID
router.get("/service-details/:id", protect, adminOnly, getServiceDetails);

// Send form to client's email
// router.post("/send-form", protect, adminOnly, sendFormToClient);
router.post("/send-form-with-details", protect, adminOnly, sendFormWithDetails);

// Route to get client services by email
router.get("/services/:email", protect, adminOnly, getClientServices);



router.post("/preview", protect, adminOnly, getFormPreview);

// Get form by ID
router.get("/:id", protect, adminOnly, getFormById);

// Delete a form
router.delete("/:id", protect, adminOnly, deleteForm);

// Update a form
router.put("/update-form/:id", protect, adminOnly, updateForm);



module.exports = router;
