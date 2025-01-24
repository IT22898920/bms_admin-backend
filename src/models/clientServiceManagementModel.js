const mongoose = require("mongoose");

const clientServiceManagementSchema = mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientemail: {
      type: String,
      required: true,
      trim: true,
    },
    clientnumber: {
      type: String,
      required: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDescription: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "completed"], // Enum for predefined statuses
      default: "pending",
    },
    isRegistered: {
      type: Boolean,
      default: false, // false means unregistered
    },
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model(
  "ClientServiceManagement",
  clientServiceManagementSchema
);
