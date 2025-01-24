const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Document = require("../models/documentModel");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const asyncHandler = require("express-async-handler");
const {
  protect,
  adminOnly,
  allowManagers,
} = require("../middlewares/authhMiddleware");
const bcrypt = require("bcryptjs");
const Notification = require("../models/notificationModel");

const router = express.Router();

// Configure Cloudinary
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
    resource_type: "auto", // Enables handling of non-image files
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max file size 5MB
  },
});

router.post(
  "/create",
  protect, // Middleware to verify user token
  
  upload.single("documentAttach"), // Middleware for file upload
  asyncHandler(async (req, res) => {
    try {
      // Extract data from the request body
      const {
        singleTextLine,
        number,
        email,
        paragraphText,
        name,
        phone,
        address,
        date,
        url,
        password, // Password can be included in the request as an empty string
        renewalPreferences, // Added renewalPreferences
      } = req.body;

      // Automatically set ClientID from the logged-in user
      const clientID = req.user._id;

      // Initialize hashedPassword variable
      let hashedPassword;

      // Hash the password only if it is provided and not empty
      if (password && password.trim() !== "") {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Construct the formData object dynamically
      const formData = {
        singleTextLine,
        number,
        email,
        paragraphText,
        name,
        phone,
        address,
        date,
        url,
        renewalPreferences:
          renewalPreferences === "true" || renewalPreferences === true, // Cast to boolean
        password: password === "" ? "" : hashedPassword || undefined, // Store hashed password if provided
        documentAttach: req.file ? req.file.path : undefined, // Include file path if a file is uploaded
      };

      // Remove undefined fields from formData (optional)
      Object.keys(formData).forEach(
        (key) => formData[key] === undefined && delete formData[key]
      );

      // Construct the full document data
      const documentData = {
        clientID,
        formData,
        status: "Pending", // Default status
        missingFields: [], // Empty array for missing fields; Admin will populate this later
      };

      // Create and save the document
      const document = new Document(documentData);
      const savedDocument = await document.save();

      // Respond with success
      res.status(201).json({
        success: true,
        message: "Document created successfully",
        document: savedDocument,
      });
    } catch (error) {
      // Log the error and respond with failure
      console.error("Error creating document:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the document",
        error: error.message,
      });
    }
  })
);










router.get(
  "/all-document",
  protect,
  asyncHandler(async (req, res) => {
    try {
      // Determine timelineStatus based on user role
      let timelineStatus;
      switch (req.user.role) {
        case "Collecting":
          timelineStatus = "Collecting";
          break;
        case "Screening":
          timelineStatus = "Screening";
          break;
        case "Processing":
          timelineStatus = "Processing";
          break;
        case "Done":
          timelineStatus = "Done";
          break;
        case "admin":
          // Admin sees everything or handle it however you wish
          timelineStatus = null;
          break;
        default:
          return res.status(403).json({
            success: false,
            message: "Your role does not permit accessing documents.",
          });
      }

      let query = {};

      // If the user is NOT admin, filter by timelineStatus
      if (timelineStatus) {
        query.timelineStatus = timelineStatus;
      }

      // Fetch documents and sort by createdAt in descending order
      const documents = await Document.find(query)
        .populate("clientID", "name email")
        .populate("serviceName", "name")
        .sort({ createdAt: -1 }); // Sorting by createdAt in descending order

      const totalDocuments = await Document.countDocuments(query);

      return res.status(200).json({
        success: true,
        documents,
        totalDocuments,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching documents",
      });
    }
  })
);



/**
 * Move document to the next timeline stage
 * e.g. from "Collecting" to "Screening", etc.
 */

router.put(
  "/next-stage/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      // Find the document
      const document = await Document.findById(id);

      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Document not found." });
      }

      // Check if the user's role matches the document's current timelineStatus
      const { role } = req.user;
      const { timelineStatus } = document;

      // Define valid transitions
      const statusMap = {
        Collecting: "Screening",
        Screening: "Processing",
        Processing: "Done",
        Done: null, // Done is the final stage
      };

      if (role !== timelineStatus) {
        return res.status(403).json({
          success: false,
          message: `You (${role}) cannot move a document in stage "${timelineStatus}".`,
        });
      }

      // Get the next stage
      const nextStatus = statusMap[timelineStatus];

      if (!nextStatus) {
        return res.status(400).json({
          success: false,
          message: "Document is already in the final stage.",
        });
      }

      // Update the timelineStatus to the next stage
      document.timelineStatus = nextStatus;

      // Optionally mark it as verified if the final stage is reached
      if (nextStatus === null) {
        document.isVerified = true;
        document.status = "Verified";
      }

      await document.save();

      return res.status(200).json({
        success: true,
        message: `Document has moved to the next stage: "${document.timelineStatus}".`,
        document,
      });
    } catch (error) {
      console.error("Error updating timelineStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  })
);




// 4) PUT /next-stage/:id => move doc from X -> X+1, if doc.timelineStatus === user.role
router.put(
  "/next-stage/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid document ID" });
      }

      // Fetch the document
      const document = await Document.findById(id);
      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Document not found" });
      }

      // Validate user role
      const { role } = req.user;
      console.log("User Role:", role);
      console.log("Document Timeline Status:", document.timelineStatus);

      if (document.timelineStatus !== role) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Document is in '${document.timelineStatus}', but your role is '${role}'.`,
        });
      }

      // Define status transitions
      const statusMap = {
        Collecting: "Screening",
        Screening: "Processing",
        Processing: "Done",
        Done: null, // No further stages
      };

      // Determine next status
      const newStatus = statusMap[document.timelineStatus];
      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Document is already in the final stage and cannot move further.",
        });
      }

      // Update document timelineStatus
      document.timelineStatus = newStatus;
      await document.save();

      res.status(200).json({
        success: true,
        message: `Document moved from '${role}' to '${newStatus}'.`,
        document,
      });
    } catch (error) {
      console.error("Error moving document to the next stage:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while moving the document to the next stage.",
      });
    }
  })
);



// Delete a document
router.delete(
  "/delete-document/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate the document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid document ID format" });
    }

    // Find the document to delete
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Use the document's title or generate a unique identifier if the title is missing
    const documentTitle =
      document.title || `Document ID: ${document._id.toString()}`;

    // Remove the file from Cloudinary if it exists
    if (document.documentAttach) {
      const publicId = document.documentAttach.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete the document
    await document.deleteOne();

    // Create a notification with the accurate title
    const notification = new Notification({
      userId: req.user._id, // Admin ID or client ID
      message: `The document "${documentTitle}" has been deleted.`, // Use static title
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: `Document "${documentTitle}" deleted successfully.`,
    });
  })
);







// Get a document by ID
router.get(
  "/document-id/:id",
  protect, // Middleware to verify user token
  // adminOnly, // Middleware to verify admin privileges

  asyncHandler(async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      res.status(200).json({
        success: true,
        document,
      });
    } catch (error) {
      console.error("Error fetching document by ID:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the document",
        error: error.message,
      });
    }
  })
);


router.get(
  "/renewal-preferences-true",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const today = new Date();

      // Fetch verified documents with renewal preferences enabled
      const documents = await Document.find({
        "formData.renewalPreferences": true,
        status: "Verified",
      })
        .populate("clientID", "name email")
        .lean();

      // Enrich documents with the next renewal date
      const enrichedDocuments = documents.map((doc) => {
        let renewalBaseDate = null;

        // Use formData.date if available; otherwise, fallback to createdAt
        if (doc.formData.date) {
          renewalBaseDate = new Date(doc.formData.date);
        } else {
          renewalBaseDate = new Date(doc.createdAt);
        }

        let nextRenewalDate = null;

        if (renewalBaseDate) {
          nextRenewalDate = new Date(renewalBaseDate);

          // Calculate the next renewal date (increment year until future date)
          while (nextRenewalDate <= today) {
            nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
          }
        }

        return {
          ...doc,
          nextRenewalDate: nextRenewalDate
            ? nextRenewalDate.toISOString()
            : null,
        };
      });

      // Sort by the next renewal date (earliest first)
      const sortedDocuments = enrichedDocuments.sort((a, b) =>
        a.nextRenewalDate > b.nextRenewalDate ? 1 : -1
      );

      // Respond with the enriched documents
      res.status(200).json({
        success: true,
        documents: sortedDocuments,
      });
    } catch (error) {
      console.error("Error fetching documents:", error.message);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the documents",
        error: error.message,
      });
    }
  })
);






const sendNotificationToClient = async (
  userId,
  documentId,
  message,
  reason,
  corrections
) => {
  try {
    // Create a new notification
    const notification = new Notification({
      userId, // Client's ID
      documentId, // Related Document ID
      message, // Notification message
      metadata: {
        reason,
        corrections,
      },
    });

    await notification.save();
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error.message);
  }
};

// Verify or Reject a Document
router.put(
  "/verify-document/:id",
  protect, // Middleware to ensure user is authenticated
  // adminOnly, // Middleware to ensure user is an admin
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // Document ID
      const { status, rejectionReason, corrections } = req.body; // Data from request body

      // Validate the document ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID format.",
        });
      }

      // Find the document and populate client details
      const document = await Document.findById(id).populate("clientID");
      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      // Handle "Verified" status
      if (status === "Verified") {
        document.status = "Verified";
        document.isVerified = true;

        await document.save();

        // Create a notification for the client
        const notification = new Notification({
          userId: document.clientID._id, // Client ID
          documentId: document._id, // Document ID
          message: "Your document has been successfully verified.",
          status: "Verified", // Add status for frontend use
        });
        await notification.save();

        return res.status(200).json({
          success: true,
          message: "Document verified, and client notified successfully.",
          document,
        });
      }

      // Handle "Rejected" status
      if (status === "Rejected") {
        // Validate rejection details
        if (!rejectionReason || !Array.isArray(corrections) || corrections.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Rejection reason and a list of corrections are required for rejection.",
          });
        }

        document.status = "Rejected";
        document.isVerified = false;
        document.adminRemarks = { rejectionReason };
        document.corrections = corrections;

        await document.save();

        // Create a notification for the client
        const notification = new Notification({
          userId: document.clientID._id, // Client ID
          documentId: document._id, // Document ID
          message: `Your document has been rejected. Reason: ${rejectionReason}`,
          status: "Rejected", // Add status for frontend use
        });
        await notification.save();

        return res.status(200).json({
          success: true,
          message: "Document rejected, and client notified successfully.",
          document,
        });
      }

      // If the status is neither "Verified" nor "Rejected"
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Only 'Verified' and 'Rejected' are supported.",
      });
    } catch (error) {
      console.error("Error verifying/rejecting document:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the document.",
      });
    }
  })
);



router.put(
  "/submit-corrections/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { formData } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid document ID" });
      }

      const document = await Document.findById(id);

      if (!document || document.status !== "Rejected") {
        return res
          .status(404)
          .json({ success: false, message: "Rejected document not found" });
      }

      Object.assign(document.formData, formData);
      document.status = "Corrected";
      document.adminRemarks = {};
      document.corrections = [];

      await document.save();

      res.status(200).json({
        success: true,
        message: "Corrections submitted successfully",
        document,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get all documents for a specific client
router.get(
  "/client-documents/:clientID",
  protect, // Middleware for authentication
  asyncHandler(async (req, res) => {
    const { clientID } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(clientID)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID format.",
        });
      }

      const documents = await Document.find({ clientID })
        .populate("clientID", "name email")
        .populate("serviceName", "name");

      if (!documents || documents.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No documents found for this client.",
        });
      }

      res.status(200).json({
        success: true,
        documents,
      });
    } catch (error) {
      console.error("Error fetching client documents:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching client documents.",
      });
    }
  })
);



router.get(
  "/user-profile-timeline",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user._id;

      // Fetch documents for the logged-in user and populate the service name and client info
      const documents = await Document.find({ clientID: userId })
        .populate("serviceName", "name") // Populate the service name
        .populate("clientID", "name email") // Populate client info
        .select("formData status timeline timelineStatus serviceName createdAt")
        .sort({ createdAt: -1 });

      console.log("Documents before mapping:", documents); // Log documents for debugging

      if (!documents || documents.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No documents found for this user",
        });
      }

      // Modify the response to show service name and client name, handling missing data
      const responseDocuments = documents.map((document) => ({
        serviceName: document.serviceName
          ? document.serviceName.name
          : "No Service Name",
        clientID: document.clientID ? document.clientID.name : "No Client Name",
        formData: document.formData,
        status: document.status,
        timelineStatus: document.timelineStatus,
        createdAt: document.createdAt,
      }));

      res.status(200).json({
        success: true,
        documents: responseDocuments,
      });
    } catch (error) {
      console.error("Error fetching user profile timeline:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the timeline",
      });
    }
  })
);






module.exports = router;
