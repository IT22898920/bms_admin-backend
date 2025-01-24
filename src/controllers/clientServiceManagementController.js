const asyncHandler = require("express-async-handler");
const ClientServiceManagement = require("../models/clientServiceManagementModel");
const nodemailer = require("nodemailer");

// Create Client Service Management Entry
const createClientService = asyncHandler(async (req, res) => {
  const {
    clientName,
    clientemail,
    clientnumber,
    serviceName,
    serviceDescription,
    status,
  } = req.body;

  if (!clientName || !clientemail || !clientnumber || !serviceName) {
    res.status(400);
    throw new Error("All required fields must be filled.");
  }

  try {
    const clientService = new ClientServiceManagement({
      clientName,
      clientemail,
      clientnumber,
      serviceName,
      serviceDescription,
      status: status || "pending",
      isRegistered: true, // Set this to false for unregistered clients
    });

    const savedClientService = await clientService.save();

    res.status(201).json({
      message: "Client service created successfully for unregistered client.",
      data: savedClientService,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to create client service. Please try again.");
  }
});

// Create a client service request (unregistered client)
const createClientServiceUnregister = asyncHandler(async (req, res) => {
  const {
    clientName,
    clientemail,
    clientnumber,
    serviceName,
    serviceDescription,
    status,
  } = req.body;

  if (!clientName || !clientemail || !clientnumber || !serviceName) {
    res.status(400);
    throw new Error("All required fields must be filled.");
  }

  try {
    const clientService = new ClientServiceManagement({
      clientName,
      clientemail,
      clientnumber,
      serviceName,
      serviceDescription,
      status: status || "pending",
      isRegistered: false, // Set this to false for unregistered clients
    });

    const savedClientService = await clientService.save();

    res.status(201).json({
      message: "Client service created successfully for unregistered client.",
      data: savedClientService,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to create client service. Please try again.");
  }
});




// Get All Client Service Management Entries
const getAllClientServices = asyncHandler(async (req, res) => {
  try {
    // Fetch all client services from the database
    const clientServices = await ClientServiceManagement.find();

    // Return response
    res.status(200).json({
      message: "Client services retrieved successfully.",
      data: clientServices,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to retrieve client services. Please try again.");
  }
});


// Delete Client Service Management Entry
const deleteClientService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find the client service by ID
    const clientService = await ClientServiceManagement.findById(id);

    // If not found, return an error
    if (!clientService) {
      res.status(404);
      throw new Error("Client service not found.");
    }

    // Delete the entry
    await clientService.deleteOne();

    // Return response
    res.status(200).json({
      message: "Client service deleted successfully.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to delete client service. Please try again.");
  }
});

// Update Client Service Status
const updateClientServiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params; // Extract ID from request params
  const { status } = req.body; // Extract new status from request body

  // Validate input
  if (!status) {
    res.status(400);
    throw new Error("Status is required.");
  }

  // Ensure the status is valid
  const validStatuses = ["active", "inactive", "pending", "completed"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status value.");
  }

  try {
    // Find the client service by ID
    const clientService = await ClientServiceManagement.findById(id);

    if (!clientService) {
      res.status(404);
      throw new Error("Client service not found.");
    }

    // Update the status
    clientService.status = status;

    // Save the updated entry
    const updatedClientService = await clientService.save();

    // Return response
    res.status(200).json({
      message: "Client service status updated successfully.",
      data: updatedClientService,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to update client service status. Please try again.");
  }
});


// Send Service Form Email
const sendServiceFormEmail = asyncHandler(async (req, res) => {
  const { email, serviceName } = req.body;

  if (!email || !serviceName) {
    return res
      .status(400)
      .json({ message: "Email and Service Name are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Service Form for ${serviceName}`,
      html: `
        <h1>Service Form Invitation</h1>
        <p>Dear Client,</p>
        <p>Please fill out the service form for: <strong>${serviceName}</strong>.</p>
        <a href="http://localhost:7001/form/${serviceName}" target="_blank">Fill Service Form</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Service form email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res
      .status(500)
      .json({ message: "Failed to send email.", error: error.message });
  }
});

// Get all client service requests for unregistered clients
const getUnregisteredClientServices = asyncHandler(async (req, res) => {
  try {
    // Fetch all client services where isRegistered is false
    const unregisteredClientServices = await ClientServiceManagement.find({
      isRegistered: false,
    });

    // If no unregistered services are found, return an appropriate message
    if (unregisteredClientServices.length === 0) {
      return res.status(404).json({
        message: "No services found for unregistered clients.",
      });
    }

    // Return the list of unregistered client services
    res.status(200).json({
      message: "Unregistered client services retrieved successfully.",
      data: unregisteredClientServices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve service list.",
      error: error.message,
    });
  }
});

const sendServiceFormUnregisterEmail = asyncHandler(async (req, res) => {
  const { email, serviceName } = req.body;

  if (!email || !serviceName) {
    return res
      .status(400)
      .json({ message: "Email and Service Name are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail account
        pass: process.env.EMAIL_PASS, // Your Gmail password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Service Form for ${serviceName}`,
      html: `
        <h1>Welcome to Our Service</h1>
        <p>Dear Client,</p>
        <p>We have successfully registered you, and your temporary password is: <strong>123456</strong>.</p>
        <p>Now, you need to log in and reset your password.</p>
        <p>You can also check your service status by visiting your <a href="http://localhost:3000/login" target="_blank">profile</a> and accessing your <strong>My Request Form</strong>.</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Service form email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res
      .status(500)
      .json({ message: "Failed to send email.", error: error.message });
  }
});






module.exports = {
  createClientService,
  createClientServiceUnregister,
  getAllClientServices,
  deleteClientService,
  updateClientServiceStatus,
  sendServiceFormEmail,
  getUnregisteredClientServices,
  sendServiceFormUnregisterEmail,
};
