const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    clientID: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the Client model
      required: true,
      ref: "Client",
    },
    serviceName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientServiceManagement", // Correct reference to the ClientServiceManagement model
    },

    formData: {
      singleTextLine: { type: String, required: false },
      number: { type: String, required: false },
      email: {
        type: String,
        required: false,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      },
      paragraphText: { type: String, required: false },
      name: { type: String, required: false },
      phone: {
        type: String,
        required: false,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
      address: { type: String, required: false },
      date: { type: Date, required: false },
      url: { type: String, required: false },
      password: { type: String, required: false },
      documentAttach: { type: String, required: false },
      renewalPreferences: {
        type: Boolean,
        required: false,
        default: false, // Default is manual renewal
      },
    },
    adminRemarks: {
      rejectionReason: { type: String, required: false }, // Only required if rejected
      description: { type: String, required: false }, // Optional admin feedback
    },
    status: {
      type: String,
      enum: ["Pending", "Rejected", "Corrected", "Verified"],
      default: "Pending", // Default state is Pending
    },
    corrections: {
      type: [String], // List of fields corrected by the client
      default: [],
    },
    missingFields: {
      type: [String], // List of missing fields identified by the admin
      default: [],
    },
    isVerified: {
      type: Boolean, // Tracks if the document is verified
      default: false,
    },
    timelineStatus: {
      type: String,
      enum: ["Collecting", "Screening", "Processing", "Done"],
      default: "Collecting", // Initially, the timeline starts at "Collecting".
    },
  },
  { timestamps: true }
);

// Add a virtual field to calculate missing fields dynamically
formSchema.virtual("calculatedMissingFields").get(function () {
  const requiredFields = [
    "singleTextLine",
    "number",
    "email",
    "paragraphText",
    "name",
    "phone",
    "address",
    "date",
    "url",
    "password",
    "documentAttach",
    "renewalPreferences", // Add this to required fields
  ];

  const missing = requiredFields.filter((field) => {
    return (
      this.formData[field] === undefined ||
      this.formData[field] === null ||
      this.formData[field] === ""
    );
  });

  return missing; // Return the list of missing fields
});

// Middleware to hash the password before saving
formSchema.pre("save", async function (next) {
  if (this.formData.password && this.isModified("formData.password")) {
    const bcrypt = require("bcryptjs");
    this.formData.password = await bcrypt.hash(this.formData.password, 10);
  }
  next();
});

module.exports = mongoose.model("Document", formSchema);
