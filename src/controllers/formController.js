const asyncHandler = require("express-async-handler");
const Form = require("../models/Form");
const nodemailer = require("nodemailer");
const User = require("../models/clientModel");
const ClientServiceManagement = require("../models/clientServiceManagementModel");
const Notification = require("../models/notificationModel"); 

// Create a new form
const createForm = asyncHandler(async (req, res) => {
  const { servicename, serviceDescription, fields } = req.body;

  // Validate input
  if (!servicename || !fields || fields.length === 0) {
    res.status(400);
    throw new Error("Form title and at least one field are required.");
  }

  // Check if a form with the same service name already exists
  const existingForm = await Form.findOne({ servicename });
  if (existingForm) {
    res.status(400);
    throw new Error("A service with the same name already exists.");
  }

  try {
    // Create the form
    const form = new Form({
      servicename,
      serviceDescription,
      fields,
    });

    await form.save();

    // Create a notification
    if (!req.user || !req.user._id) {
      throw new Error(
        "User authentication is required to create a notification."
      );
    }

    const notification = new Notification({
      userId: req.user._id, // The logged-in admin's ID
      message: `A new service "${servicename}" has been added.`,
    });

    await notification.save();

    res.status(201).json({
      message: "Form created successfully, and notification sent.",
      data: form,
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500);
    throw new Error("Failed to create form. Please try again.");
  }
});


// Get all forms
const getForms = asyncHandler(async (req, res) => {
  const forms = await Form.find(); // No populate call
  res.status(200).json({
    message: "Forms retrieved successfully",
    data: forms,
  });
});


// Get form by ID
const getFormById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const form = await Form.findById(id);

  if (!form) {
    res.status(404);
    throw new Error("Form not found.");
  }

  res.status(200).json({
    message: "Form retrieved successfully",
    form,
  });
});

// Delete a form
const deleteForm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the form by ID
  const form = await Form.findById(id);

  if (!form) {
    res.status(404);
    throw new Error("Form not found.");
  }

  const serviceName = form.servicename; // Store the service name for the notification

  // Delete the form
  await form.deleteOne();

  try {
    // Create a notification
    if (!req.user || !req.user._id) {
      throw new Error(
        "User authentication is required to create a notification."
      );
    }

    const notification = new Notification({
      userId: req.user._id, // The logged-in admin's ID
      message: `The service "${serviceName}" has been deleted.`,
    });

    await notification.save();

    console.log("Notification sent for service deletion.");
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }

  res.status(200).json({
    message: `Service "${serviceName}" deleted successfully, and notification sent.`,
  });
});



// Update a form
const updateForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { servicename, serviceDescription, fields } = req.body;

  // Find the form by ID
  const form = await Form.findById(id);

  if (!form) {
    res.status(404);
    throw new Error("Form not found.");
  }

  // Check if the new service name is already in use by another form
  if (servicename && servicename !== form.servicename) {
    const existingForm = await Form.findOne({ servicename });
    if (existingForm) {
      res.status(400);
      throw new Error("A service with the same name already exists.");
    }
  }

  // Update the form fields if provided in the request body
  form.servicename = servicename || form.servicename;
  form.serviceDescription = serviceDescription || form.serviceDescription;
  form.fields = fields || form.fields;

  // Save the updated form
  const updatedForm = await form.save();

  try {
    // Create a notification
    if (!req.user || !req.user._id) {
      throw new Error(
        "User authentication is required to create a notification."
      );
    }

    const notification = new Notification({
      userId: req.user._id, // The logged-in admin's ID
      message: `The service "${form.servicename}" has been updated.`,
    });

    await notification.save();

    console.log("Notification sent for service update.");
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }

  res.status(200).json({
    message: "Form updated successfully, and notification sent.",
    data: updatedForm,
  });
});


// Get Service Details by ID
const getServiceDetails = asyncHandler(async (req, res) => {
  const { id } = req.params; // Extract the service ID from the request params

  try {
    // Fetch the service details from the database
    const service = await Form.findById(id);

    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    res.status(200).json({
      message: "Service details retrieved successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve service details. Please try again later.",
      error: error.message,
    });
  }
});

// Get all service names
const getServiceNames = asyncHandler(async (req, res) => {
  try {
    const services = await Form.find({}, "servicename"); // Fetch only the 'servicename' field
    const serviceNames = services.map((service) => service.servicename);

    res.status(200).json({
      message: "Service names retrieved successfully",
      data: serviceNames,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve service names. Please try again later.",
      error: error.message,
    });
  }
});




const getServiceNamesUnregister = asyncHandler(async (req, res) => {
  try {
    const services = await Form.find({}, "servicename"); // Fetch only the 'servicename' field
    const serviceNames = services.map((service) => service.servicename);

    res.status(200).json({
      message: "Service names retrieved successfully",
      data: serviceNames,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve service names. Please try again later.",
      error: error.message,
    });
  }
});

// const sendFormToClient = asyncHandler(async (req, res) => {
//   const { email, formId } = req.body;

//   if (!email || !formId) {
//     res.status(400);
//     throw new Error("Email and form ID are required.");
//   }

//   const form = await Form.findById(formId);
//   if (!form) {
//     res.status(404);
//     throw new Error("Form not found.");
//   }

//   try {
//     console.log("Attempting to send email...");
// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD, // Use App Password here
//   },
// });


//     const mailOptions = {
//       from: process.env.EMAIL_USERNAME,
//       to: email,
//       subject: `Form for ${form.servicename}`,
//       html: `<h3>Form for ${form.servicename}</h3>`,
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully:", result);

//     res.status(200).json({ message: "Form sent successfully." });
//   } catch (error) {
//     console.error("Email sending error:", error);
//     res.status(500);
//     throw new Error("Failed to send the form. Please try again.");
//   }
// });




const sendFormWithDetails = asyncHandler(async (req, res) => {
  const { email, serviceName } = req.body;

  // Validate input
  if (!email || !serviceName) {
    res.status(400);
    throw new Error("Email and service name are required.");
  }

  // Fetch the form by service name
  const form = await Form.findOne({ servicename: serviceName });
  if (!form) {
    res.status(404);
    throw new Error("Service form not found.");
  }

  // Fetch the client by email
  const client = await User.findOne({ email });
  if (!client) {
    res.status(404);
    throw new Error("Client not found.");
  }

  // Add the form's ID to the client's `services` array (if not already present)
  if (!client.services.includes(form._id)) {
    client.services.push(form._id);
    await client.save();
  }

  // Fetch the client service entry
  const clientService = await ClientServiceManagement.findOne({
    clientemail: email,
    serviceName,
  });
  if (!clientService) {
    res.status(404);
    throw new Error("Client service entry not found.");
  }
  // Update the status to "active"
  clientService.status = "active";
  await clientService.save();

  // Create a notification for the client
  const notification = new Notification({
    userId: client._id,
    documentId: form._id,
    message: `The service form for "${serviceName}" has been sent to your email and your profile.`,
  });
  await notification.save();

  // Send the email (logic unchanged)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Details for Service: ${form.servicename}`,
    html: `
      <h3>Service Name: ${form.servicename}</h3>
      <p><strong>Description:</strong> ${form.serviceDescription}</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({
    message: "Service form sent successfully and status updated to active.",
  });
});

const getClientServices = asyncHandler(async (req, res) => {
  const { email } = req.params;

  // Find the client by email and populate their services
  const client = await User.findOne({ email }).populate("services");
  if (!client) {
    res.status(404);
    throw new Error("Client not found.");
  }

  console.log("Client services:", client.services); // Add this log

  res.status(200).json({
    message: "Client services retrieved successfully.",
    data: client.services,
  });
});






const getFormPreview = asyncHandler(async (req, res) => {
  const { servicename } = req.body; // Extract from req.body since it's a POST request

  if (!servicename) {
    res.status(400);
    throw new Error("Service name is required.");
  }

  // Find the form by service name
  const form = await Form.findOne({ servicename });

  if (!form) {
    res.status(404);
    throw new Error("Service form not found.");
  }

  res.status(200).json({
    message: "Service form preview retrieved successfully.",
    data: form,
  });
});





module.exports = {
  createForm,
  getForms,
  getFormById,
  deleteForm,
  updateForm,
  getServiceDetails,
  getServiceNames,
  getServiceNamesUnregister,
  // sendFormToClient,
  sendFormWithDetails,
  getFormPreview,
  getClientServices,
};
