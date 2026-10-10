require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const galleryRoutes = require("./routes/galleryRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Serve uploaded gallery images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CampusConnect API is running.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy.",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/gallery", galleryRoutes);

// Admin verification
app.get("/api/admin/verify", async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const configuredAdminKey = process.env.ADMIN_KEY;

    if (!configuredAdminKey) {
      return res.status(500).json({
        success: false,
        message: "Admin key is not configured on the server.",
      });
    }

    if (
      typeof adminKey !== "string" ||
      adminKey !== configuredAdminKey
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin key.",
      });
    }

    return res.json({
      success: true,
      message: "Admin verified successfully.",
    });
  } catch (error) {
    console.error("Admin verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access.",
    });
  }
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from backend/.env");
    }

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        "JWT_SECRET must be configured in backend/.env and contain at least 32 characters."
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB Atlas connected successfully.");

    app.listen(PORT, () => {
      console.log(`CampusConnect backend running on http://localhost:${PORT}`);
      console.log(`Gallery API: http://localhost:${PORT}/api/gallery`);
      console.log(`Uploaded images: http://localhost:${PORT}/uploads/`);
    });
  } catch (error) {
    console.error("Failed to start CampusConnect backend:", error.message);
    process.exit(1);
  }
}

startServer();