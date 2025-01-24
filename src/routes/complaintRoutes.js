const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Complaint = require("../models/complaintModel"); // Complaint model
const asyncHandler = require("express-async-handler");
const {
  protect,
  adminOnly,
  allowManagers,
} = require("../middlewares/authhMiddleware");
const Notification = require("../models/notificationModel"); // Import Notification model


const router = express.Router();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "complaints",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    resource_type: "auto",
    access_mode: "public", // Ensure the file is publicly accessible
  },
});


const upload = multer({ storage });


router.post(
  "/creates",
  protect, // Ensure the user is authenticated
  upload.single("fileAttachment"), // Handle file upload
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      complaintSubject,
      complaintDetails,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !contactNumber ||
      !complaintSubject ||
      !complaintDetails
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const fileAttachment = req.file ? req.file.path : null;
console.log("Uploaded file path:", req.file.path);

    // Create the complaint
    const complaint = await Complaint.create({
      firstName,
      lastName,
      email,
      contactNumber,
      complaintSubject,
      complaintDetails,
      fileAttachment,
    });

    if (complaint) {
      // Create a notification for the client
      const notification = new Notification({
        userId: req.user._id, // Assuming the logged-in user is submitting the complaint
        documentId: complaint._id, // Complaint ID as the associated document
        message: `Your compliance complaint regarding "${complaintSubject}" has been submitted successfully.`,
      });
      await notification.save();

      res.status(201).json({
        message: "Complaint created successfully",
        data: complaint,
      });
    } else {
      res.status(400);
      throw new Error("Failed to create complaint");
    }
  })
);










router.get(
  "/filter/:subject",
  protect,
  allowManagers(
    "admin",
    "KYC_Management",
    "BRN_Tracking",
    "RegulatoryMonitoring",
    "ComplianceDocumentation"
  ),
  async (req, res) => {
    try {
      const subject = req.params.subject;

      // Mapping roles to their allowed subjects
      const roleSubjectMap = {
        admin: [
          "KYC Management",
          "BRN Tracking",
          "Compliance Documentation",
          "Regulatory Monitoring",
        ],
        KYC_Management: ["KYC Management"],
        BRN_Tracking: ["BRN Tracking"],
        RegulatoryMonitoring: ["Regulatory Monitoring"],
        ComplianceDocumentation: ["Compliance Documentation"],
      };

      // Get the allowed subjects for the user's role
      const allowedSubjects = roleSubjectMap[req.user.role] || [];

      // Check if the requested subject is valid for the user's role
      if (!allowedSubjects.includes(subject)) {
        return res.status(403).json({
          message: `You are not authorized to access complaints for ${subject}`,
        });
      }

      // Fetch complaints matching the subject and sort by createdAt in descending order (latest first)
      const complaints = await Complaint.find({
        complaintSubject: subject,
      }).sort({ createdAt: -1 }); // Sorting complaints by creation date, latest first

      if (complaints.length === 0) {
        return res
          .status(404)
          .json({ message: `No complaints found for ${subject}` });
      }

      // Only return the desired fields
      const result = complaints.map((complaint) => ({
        firstName: complaint.firstName,
        email: complaint.email,
        contactNumber: complaint.contactNumber,
        complaintSubject: complaint.complaintSubject,
        complaintDetails: complaint.complaintDetails,
        fileAttachment: complaint.fileAttachment,
        status: complaint.status || "No default status", // In case no status is assigned
      }));

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch complaints", error });
    }
  }
);


const createComplaintNotification = async (userId, complaintId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error("Complaint not found");
  }

  const notification = new Notification({
    userId,
    complaintId,
    message: `Your compliance complaint with the subject "${complaint.complaintSubject}" has been submitted successfully.`,
  });

  await notification.save();
  return notification;
};


// Route to fetch complaints
router.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find(
      {}, // No filter, fetch all complaints
      "firstName contactNumber complaintSubject complaintDetails createdAt" // Fields to include
    );
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports = router;
