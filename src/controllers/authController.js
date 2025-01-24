const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Client = require("../models/clientModel");

// Admin Registration
const adminRegister = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    if (role && role === "client") {
      return res
        .status(400)
        .json({ message: "Admin cannot have 'client' role." });
    }

    const existingAdmin = await User.findOne({ username, role: "admin" });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "An admin with this username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      password: hashedPassword,
      role: role || "admin", // Default to 'admin'
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin registered successfully.",
      admin: { username: newAdmin.username, role: newAdmin.role },
    });
  } catch (error) {
    console.error("Error registering admin:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Client Registration
const clientRegister = async (req, res) => {
  try {
    const { clientName, clientEmail, clientContact, clientAddress, password } = req.body;

    if (!clientName || !clientEmail || !clientContact || !clientAddress || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if a client with the same username or contact already exists
    const existingClient = await Client.findOne({
      $or: [{ username: clientName }, { clientContact: clientContact }],
    });

    if (existingClient) {
      return res.status(400).json({
        message: "A client with the given name or contact already exists.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new client
    const newClient = new Client({
      username: clientName,
      password: hashedPassword,
      clientEmail,
      role: "client", // Assign 'client' role by default
      clientName,
      clientContact,
      clientAddress,
    });

    // Save client to database
    await newClient.save();

    // Return success response
    res.status(201).json({
      message: "Client registered successfully.",
      client: {
        username: newClient.username,
        clientName: newClient.clientName,
        clientContact: newClient.clientContact,
        clientAddress: newClient.clientAddress,
        role: newClient.role,
      },
    });
  } catch (error) {
    console.error("Error registering client:", error.message);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    // Query both User and Client collections
    const user = await User.findOne({ username });
    const client = await Client.findOne({ clientName: username }); // Search by clientName for Client

    const account = user || client;

    if (!account) {
      return res.status(404).json({ message: `User with username ${username} not found.` });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: account._id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response based on the account type
    const response = {
      message: "Login successful",
      token,
      username: account.username || account.clientName, // Admin: username; Client: clientName
      role: account.role,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};









module.exports = {
  adminRegister,
  clientRegister,
  login,
};
