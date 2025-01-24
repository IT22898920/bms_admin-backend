const asyncHandler = require("express-async-handler");
const User = require("../models/clientModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Notification = require("../models/notificationModel");
const ClientServiceManagement = require("../models/clientServiceManagementModel"); // Import ClientServiceManagement model
const Token = require('../models/tokenModel'); // Adjust the path as necessary
const crypto = require("crypto");
const sendEmail = require('../../utils/sendEmail'); // Adjust the path based on where your userController.js is located


// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create stripe customer
  // const customer = await stripe.customers.create({ email });

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    role,
    // stripeCustomerId: customer.id,
  });

  // Update ClientServiceManagement to set isRegistered to true
  await ClientServiceManagement.updateMany(
    { clientemail: email, isRegistered: false }, // Find unregistered service requests for this email
    { isRegistered: true } // Set isRegistered to true
  );

  //   Generate Token
  const token = generateToken(user._id);

  if (user) {
    const { _id, name, email, phone, role } = user;
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      // sameSite: "none",
      // secure: true,
    });

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      role,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
})

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //   Generate Token
  const token = generateToken(user._id);
console.log(token);
    if (passwordIsCorrect) {
      // Send Login cookie
      res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        // expires: new Date(Date.now() + 1000 * 86400), // 1 day
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      });
    }

      if (user && passwordIsCorrect) {
        const { _id, name, email, phone, address,  } = user;
        const newUser = await User.findOne({ email }).select("-password");

        res.status(200).json(newUser);
      } else {
        res.status(400);
        throw new Error("Invalid email or password");
      }
})


// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    // const { _id, name, email, phone, address } = user;
    res.status(200).json(user);
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

// Get Login Status
const getLoginStatus = asyncHandler(async (req, res) => {
  // console.log("getLoginStatus Fired");
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, phone, address } = user;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.address = req.body.address || address;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      photo: updatedUser.photo,
      address: updatedUser.address,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update Photo
const updatePhoto = asyncHandler(async (req, res) => {
  const { photo } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.photo = photo;
  const updatedUser = await user.save();
  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    photo: updatedUser.photo,
    address: updatedUser.address,
  });
});

const getAllClients = asyncHandler(async (req, res) => {
  // Check if the requesting user is an admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Admins only.");
  }

  try {
    // Fetch all clients (excluding passwords for security)
    const clients = await User.find({ role: "client" }).select("-password");
    res.status(200).json({
      message: "Clients retrieved successfully",
      data: clients,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to retrieve clients. Please try again later.");
  }
});


const deleteClient = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Admins only.");
  }

  const { id } = req.params;

  try {
    const client = await User.findById(id);

    if (!client) {
      res.status(404);
      throw new Error("Client not found.");
    }

    if (client.role !== "client") {
      res.status(400);
      throw new Error("You can only delete clients.");
    }

    await client.deleteOne();

    // Create a notification for the admin
    try {
      console.log("Creating notification for admin...");
      const notification = new Notification({
        userId: req.user._id, // Admin's user ID
        message: `Client ${client.name} has been deleted successfully.`,
      });

      await notification.save();
      console.log("Notification created successfully!");
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      throw new Error("Failed to create notification.");
    }

    res.status(200).json({
      message: "Client deleted successfully, and admin notified.",
    });
  } catch (error) {
    console.error("Error deleting client:", error); // Log the exact error
    res.status(500);
    throw new Error("Failed to delete client. Please try again later.");
  }
});




// Get Client Details by ID
const getClientDetails = asyncHandler(async (req, res) => {
  const { id } = req.params; // Extract the client ID from the request params

  try {
    // Fetch the client details from the database
    const client = await User.findById(id).select("-password"); // Use User model instead of Client

    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }

    res.status(200).json({
      message: "Client details retrieved successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve client details. Please try again later.",
      error: error.message,
    });
  }
});





// Get Client Services
const getClientServices = asyncHandler(async (req, res) => {
  try {
    // Fetch the logged-in client and populate their services
    const client = await User.findById(req.user._id).populate("services").select("-password");

    if (!client) {
      res.status(404);
      throw new Error("Client not found.");
    }

    res.status(200).json({
      message: "Client services retrieved successfully.",
      data: client.services,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to retrieve client services. Please try again later.");
  }
});


const getAllUsersExceptClients = asyncHandler(async (req, res) => {
  try {
    // Fetch all users except those with the role of "client", excluding passwords
    const users = await User.find({ role: { $ne: "client" } }).select(
      "-password"
    );
    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve users. Please try again later.",
      error: error.message,
    });
  }
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required.");
  }

  try {
    // 1) Find user to update
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    // 2) Update status
    user.status = status;
    await user.save();

    // 3) Find the admin user (if you have multiple admins, you could do something like:
    //    const admins = await User.find({ role: 'admin' });
    //    and loop through them creating multiple notifications.)
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      // 4) Create a notification for the admin
      await Notification.create({
        userId: adminUser._id, // Admin's _id
        message: `User "${user.name}" (ID: ${user._id}) status updated to "${status}".`,
        // Optionally include documentId or complaintId if relevant
      });
    }

    res.status(200).json({ message: "Status updated successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status.", error: error.message });
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log("Generated Reset Token:", resetToken); // Log generated token

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email Message
  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the URL below to reset your password:</p>
    <p>This reset link is valid for only 30 minutes.</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
    <p>Regards...</p>
    <p>Pinvent Team</p>
  `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    console.log(`Sending email to ${send_to}...`); // Log email sending attempt
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    console.error("Error sending email:", error); // Log any error in sending email
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});


// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});




module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  getLoginStatus,
  updateUser,
  updatePhoto,
  getAllClients,
  deleteClient,
  getClientDetails,
  getClientServices,
  getAllUsersExceptClients,
  updateUserStatus,
  changePassword,
  forgotPassword,
  resetPassword,
};
