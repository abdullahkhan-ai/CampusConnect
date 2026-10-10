
const express = require("express");
const { register, login } = require("../services/authService");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const result = await register(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    if (
      error.message.startsWith("Please") ||
      error.message.startsWith("Password")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register your account.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body || {});

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    if (
      error.message === "Please enter your email and password." ||
      error.message === "Invalid email or password."
    ) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

module.exports = router;
