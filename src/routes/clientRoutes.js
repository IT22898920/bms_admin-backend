const express = require("express");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const Client = require("../models/clientModel");

const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "clients-image", // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// Route to retrieve all client details with optional pagination
router.get(
  "/retrieve",
  verifyToken, // Ensure the user is authenticated
  authorizeRoles("client"), // Only allow authorized roles
  async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query; // Default pagination values
      const skip = (page - 1) * limit;

      // Fetch all clients with pagination
      const clients = await Client.find()
        .skip(Number(skip))
        .limit(Number(limit));

      if (!clients || clients.length === 0) {
        return res.status(404).json({ message: "No clients found." });
      }

      const totalClients = await Client.countDocuments();
      res.status(200).json({
        message: "Clients retrieved successfully.",
        clients,
        totalPages: Math.ceil(totalClients / limit),
        currentPage: Number(page),
      });
    } catch (error) {
      console.error("Error retrieving clients:", error.message);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

// Route to retrieve client details by ID
router.get(
  "/retrieve/:id",
  verifyToken, // Ensure the user is authenticated
  authorizeRoles("admin", "user"), // Only allow authorized roles
  async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch the client by ID
      const client = await Client.findById(id);

      if (!client) {
        return res.status(404).json({ message: "Client not found." });
      }

      res.status(200).json({
        message: "Client details retrieved successfully.",
        client,
      });
    } catch (error) {
      console.error("Error retrieving client details:", error.message);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

// Route to update client details, including image upload
router.put(
  "/update/:id",
  verifyToken, // Ensure the user is authenticated
  authorizeRoles("user"), // Only allow authorized roles
  upload.single("image"), // Handle image upload
  async (req, res) => {
    try {
      const { id } = req.params;
      const { clientName, clientEmail, clientContact, clientAddress } = req.body;

      // Ensure at least one field is provided for updating
      if (!clientName && !clientEmail && !clientContact && !clientAddress && !req.file) {
        return res
          .status(400)
          .json({ message: "At least one field or an image is required to update." });
      }

      // Prepare update fields
      const updateFields = {
        ...(clientName && { clientName }),
        ...(clientEmail && { clientEmail }),
        ...(clientContact && { clientContact }),
        ...(clientAddress && { clientAddress }),
        ...(req.file && { image: req.file.path }), // Update image if uploaded
      };

      // Find the client by ID and update the provided fields
      const updatedClient = await Client.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true } // Return the updated document and validate inputs
      );

      // Check if the client exists
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found." });
      }

      res.status(200).json({
        message: "Client updated successfully.",
        client: updatedClient,
      });
    } catch (error) {
      console.error("Error updating client:", error.message);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

module.exports = router;
