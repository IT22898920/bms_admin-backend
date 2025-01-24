const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Service = require("../models/serviceModel");
const { protect, adminOnly } = require("../middlewares/authhMiddleware");
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");


const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "complaints",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    resource_type: "auto", // Enables handling of non-image files
    //access_mode: "public",
  },
});
const upload = multer({ storage });

// Route to handle service creation
// router.post(
//   "/post",
//   protect,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { serviceName, description } = req.body;
//       const image = req.file;

//       if (!serviceName || !description || !image) {
//         return res.status(400).json({ message: "All fields are required" });
//       }

//       // Save the new service
//       const newService = new Service({
//         serviceName,
//         description,
//         image: image.path, // Store the Cloudinary URL
//         createdBy: req.user.id, // The admin who created it
//       });

//       await newService.save();

//       res.status(201).json({
//         message: "Service created successfully",
//         service: newService,
//       });
//     } catch (error) {
//       console.error("Error creating service:", error.message);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// );

// Route to retrieve all services created by the admin
// router.get(
//   "/retrieve",
//   verifyToken,
//   authorizeRoles("admin"),
//   async (req, res) => {
//     try {
//       // Fetch services created by the logged-in admin
//       const services = await Service.find({ createdBy: req.user.id });

//       if (services.length === 0) {
//         return res.status(404).json({ message: "No services found" });
//       }

//       res
//         .status(200)
//         .json({ message: "Services retrieved successfully", services });
//     } catch (error) {
//       console.error("Error retrieving services:", error.message);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// );


router.post(
  "/create",
  protect,
  adminOnly,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { serviceName, description } = req.body;

    if (!serviceName || !description) {
      res.status(400);
      throw new Error("Service name and description are required.");
    }

    // Check for duplicate services
    const serviceExists = await Service.findOne({ serviceName });
    if (serviceExists) {
      res.status(400);
      throw new Error(`Service with the name "${serviceName}" already exists.`);
    }

    // Save image if provided
    const image = req.file ? req.file.path : null;

    // Create the new service
    const service = await Service.create({
      serviceName,
      description,
      image,
      createdBy: req.user._id, // Admin creating the service
    });

    if (service) {
console.log("Attempting to create notification...");
const notification = new Notification({
  userId: req.user._id,
  message: `A new service "${serviceName}" has been added.`,
});
await notification.save();
console.log("Notification created:", notification);


      res.status(201).json({
        success: true,
        message: "Service created successfully, and notification sent.",
        service,
      });
    } else {
      res.status(400);
      throw new Error("Failed to create service.");
    }
  })
);








router.get(
  "/all",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    try {
      const services = await Service.find(); // Fetch all services
      if (!services || services.length === 0) {
        res.status(404).json({ message: "No services found." });
      } else {
        res.status(200).json({
          message: "Services retrieved successfully.",
          services,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch services.",
        error: error.message,
      });
    }
  })
);





module.exports = router;
