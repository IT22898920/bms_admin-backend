const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add a email"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid emaial",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [4, "Password must be up to 4 characters"],
      //   maxLength: [23, "Password must not be more than 23 characters"],
    },
    role: {
      type: String,
      required: [true],
      default: "client",
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form", // Reference to the Form schema
      },
    ],

    photo: {
      type: String,
      required: [true, "Please add a photo"],
      default: "https://i.ibb.co/4pDNDk1/avatar.png",
    },
    phone: {
      type: String,
      default: "+94",
    },
    address: {
      type: Object,
      // address, state, country
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Suspended"],
    },
    isRegistered: {
      type: Boolean,
      default: false, // Default value is false until client is registered
    },
  },

  {
    timestamps: true,
  }
);

// Encrypt password before saving to DB
clientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

module.exports = mongoose.model("Client", clientSchema);
