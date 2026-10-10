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

// CORS: Allow the deployed CampusConnect frontend and local development.
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://campus-connect-delta-one.vercel.app",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    process.env.FRONTEND_URL.replace(/\/+$/, "")
  );
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-admin-key",
      "Authorization",
    ],
    optionsSuccessStatus: 204,
  })
);

// Parse JSON requests.
app.use(express.json({ limit: "1mb" }));

// Serve uploaded gallery images.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API root.
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CampusConnect API is running.",
  });
});

// Health check.
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

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/gallery", galleryRoutes);

// Verify admin key.
app.get("/api/admin/verify", (req, res) => {
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

// Connect to MongoDB and start the server.
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from backend/.env");
    }

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        "JWT_SECRET must contain at least 32 characters."
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB Atlas connected successfully.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `CampusConnect backend running on port ${PORT}`
      );
      console.log("CORS allowed origins:", allowedOrigins);
    });
  } catch (error) {
    console.error(
      "Failed to start CampusConnect backend:",
      error.message
    );
    process.exit(1);
  }
}

startServer();
