const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  type: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  placeholder: {
    type: String,
    required: false,
  },
  required: {
    type: Boolean,
    required: false,
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can store different data types (string, number, etc.)
    required: false,
  },
  width: {
    type: Number, // Store as percentage
    required: false,
  },
  height: {
    type: Number, // Store as percentage
    required: false,
  },
  top: {
    type: Number, // Position (top percentage)
    required: false,
  },
  left: {
    type: Number, // Position (left percentage)
    required: false,
  },
});

const formSchema = new mongoose.Schema(
  {
    servicename: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    fields: [fieldSchema],
    lastSentTo: { type: String }, // Add this field to store the last email
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model("Form", formSchema);