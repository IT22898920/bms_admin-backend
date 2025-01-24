const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    complaintSubject: {
      type: String,
      required: true,
      enum: [
        "KYC Management",
        "BRN Tracking",
        "Compliance Documentation",
        "Regulatory Monitoring",
      ],
      trim: true,
    },
    complaintDetails: {
      type: String,
      required: true,
      trim: true,
    },
    fileAttachment: {
      type: String,
      // required: false,
    },
    status: {
      type: String,
      enum: ["pending", "verified"], // Allowed values for status
      default: "pending", // Default value
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Complaintss", complaintSchema);
