const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authController.getProfile);
router.post("/update", authController.updateUser);

module.exports = router;