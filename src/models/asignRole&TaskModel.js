const mongoose = require("mongoose");
const Client = require("./clientModel"); // Import ClientModel

const rolesTaskSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    taskDescription: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["High", "Medium", "Low"],
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to update client role when task role changes
rolesTaskSchema.pre("save", async function (next) {
  // Check if the role has changed
  if (this.isModified("role")) {
    // Find the client by email and update their role
    const client = await Client.findOneAndUpdate(
      { email: this.email },
      { role: this.role }
    );

    if (!client) {
      throw new Error("Client not found for the given email");
    }
  }

  next();
});

module.exports = mongoose.model("Roles&Task", rolesTaskSchema);
