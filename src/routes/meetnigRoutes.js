const express = require("express");
const authorizeRoles = require("../middlewares/roleMiddleware");
const Meeting = require("../models/meetingModel");
const asyncHandler = require("express-async-handler");
const {
  protect,
  adminOnly,
  allowManagers,
} = require("../middlewares/authhMiddleware");
const Notification = require("../models/notificationModel"); 

const router = express.Router();

// Create-meeting route
router.post(
  "/create-meeting",
  protect,
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      contactNumber,
      preferredDate,
      preferredTime,
      description,
    } = req.body;

    const userEmail = req.user.email; // The logged-in user's email
    const userId = req.user._id; // The logged-in user's ID for the client notification

    // Validation
    if (
      !firstName ||
      !lastName ||
      !contactNumber ||
      !preferredDate ||
      !preferredTime ||
      !description
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }

    // Check for conflicting time slots
    const conflictingMeeting = await Meeting.findOne({
      preferredDate,
      preferredTime,
    });
    if (conflictingMeeting) {
      res.status(400);
      throw new Error(
        `The selected time slot (${preferredTime} on ${preferredDate}) is already full. Please choose another time.`
      );
    }

    // Create a new meeting
    const meeting = await Meeting.create({
      firstName,
      lastName,
      email: userEmail, // The user scheduling the meeting
      contactNumber,
      preferredDate,
      preferredTime,
      description,
    });

    if (!meeting) {
      res.status(400);
      throw new Error("Failed to schedule meeting");
    }

    // 1) Notify the CLIENT
    let clientNotification;
    try {
      clientNotification = await Notification.create({
        userId, // The logged-in user's ID
        message: `Your meeting is scheduled for ${preferredDate} at ${preferredTime}.`,
      });
    } catch (err) {
      console.error("Failed to create client notification:", err);
    }

    // 2) Notify the ADMIN
    try {
      // Find an admin user by role
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) {
        await Notification.create({
          userId: adminUser._id, // The admin's userId
          message: `A new schedule was created by ${userEmail} for ${preferredDate} at ${preferredTime}.`,
        });
      }
    } catch (err) {
      console.error("Failed to create admin notification:", err);
    }

    // Send final response
    if (clientNotification) {
      res.status(201).json({
        message: "Meeting scheduled successfully. Notifications sent.",
        meeting,
      });
    } else {
      res.status(201).json({
        message:
          "Meeting scheduled successfully. (Client or Admin notification might have failed.)",
        meeting,
      });
    }
  })
);

// Get all meetings route for admins
router.get(
  "/all-meetings",
  protect, // Ensure the user is authenticated
  allowManagers("admin", "ScheduledMeetings"),
  asyncHandler(async (req, res) => {
    try {
      const meetings = await Meeting.find(); // Fetch all meetings
      res.status(200).json({
        message: "Meetings retrieved successfully",
        meetings,
      });
    } catch (error) {
      res.status(500);
      throw new Error("Failed to retrieve meetings");
    }
  })
);



  


module.exports = router;
