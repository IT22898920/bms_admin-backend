const mongoose = require("mongoose");

// Token Schema
const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // or 'Client' depending on the model you're using for users
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create Token Model
const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
