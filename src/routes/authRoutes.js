const express = require("express");
const { adminRegister, login, clientRegister} = require("../controllers/authController");
const router = express.Router();

router.post("/admin/register", adminRegister);
router.post("/client/register", clientRegister);
router.post("/login", login);

module.exports = router;
