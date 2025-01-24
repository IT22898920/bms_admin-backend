const express = require("express");
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");
const { protect } = require("../middlewares/authhMiddleware");

const router = express.Router();

// Define routes
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, notifications });
  })
);


router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    notification.isRead = true;
    await notification.save();
    res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  })
);
// Create a new notification
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { userId, documentId, complaintId, message } = req.body;

    if (!userId || !message) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and message are required" });
    }

    const notification = new Notification({
      userId,
      documentId: documentId || null, // Optional
      complaintId: complaintId || null, // Optional
      message,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  })
);

// DELETE /api/notifications/clear
router.delete(
  "/clear",
  protect,
  asyncHandler(async (req, res) => {
    // This deletes ALL notifications for the logged-in user
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  })
);


// Export the router
module.exports = router;
