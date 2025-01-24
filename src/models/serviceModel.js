const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Store the image file path or URL
  //    required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the admin who created it
      // ref: "Admin",
      // required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Service", serviceSchema);
