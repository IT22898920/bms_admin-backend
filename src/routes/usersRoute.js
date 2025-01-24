const express = require("express");
const {
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
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middlewares/authhMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/getUser", protect, getUser);
router.get("/getLoginStatus", getLoginStatus);
router.patch("/updateUser", protect, updateUser);
router.patch("/updatePhoto", protect, updatePhoto);
router.get("/all-clients", protect, adminOnly, getAllClients);
router.delete("/delete-client/:id", protect, adminOnly, deleteClient);
router.get(
  "/client-management-details/:id",
  protect,
  adminOnly,
  getClientDetails
);
router.get("/client-services", protect, getClientServices);
router.get(
  "/all-users-except-clients",
  protect,
  adminOnly,
  getAllUsersExceptClients
);
router.patch("/update-status/:id", protect, adminOnly, updateUserStatus);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
module.exports = router;