
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Event = require("../models/Event");
const GalleryPhoto = require("../models/GalleryPhoto");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

const uploadDirectory = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${require("crypto").randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG, WebP, and GIF images are allowed.")
      );
    }

    callback(null, true);
  },
});

// Public: view gallery photos for an event.
router.get("/event/:eventId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const photos = await GalleryPhoto.find({
      event: req.params.eventId,
    })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      photos: photos.map((photo) => ({
        ...photo,
        url: `/uploads/${encodeURIComponent(photo.filename)}`,
      })),
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load gallery photos.",
    });
  }
});

// Admin only: upload one photo for an event.
router.post(
  "/event/:eventId",
  requireAdmin,
  (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (!error) return next();

      const status = error instanceof multer.MulterError ? 400 : 400;

      return res.status(status).json({
        success: false,
        message: error.message || "Image upload failed.",
      });
    });
  },
  async (req, res) => {
    let savedFilename = null;

    try {
      if (!mongoose.isValidObjectId(req.params.eventId)) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          success: false,
          message: "Invalid event ID.",
        });
      }

      const event = await Event.findById(req.params.eventId);

      if (!event) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(404).json({
          success: false,
          message: "Event not found.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Choose an image to upload.",
        });
      }

      savedFilename = req.file.filename;

      const caption =
        typeof req.body.caption === "string"
          ? req.body.caption.trim().slice(0, 200)
          : "";

      const photo = await GalleryPhoto.create({
        event: event._id,
        filename: req.file.filename,
        originalName: path.basename(req.file.originalname).slice(0, 255),
        caption,
        contentType: req.file.mimetype,
      });

      return res.status(201).json({
        success: true,
        message: "Photo uploaded successfully.",
        photo: {
          id: photo._id,
          event: photo.event,
          filename: photo.filename,
          caption: photo.caption,
          contentType: photo.contentType,
          createdAt: photo.createdAt,
          url: `/uploads/${encodeURIComponent(photo.filename)}`,
        },
      });
    } catch (error) {
      if (req.file && savedFilename) {
        fs.unlink(req.file.path, () => {});
      }

      console.error("Gallery upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not upload the photo.",
      });
    }
  }
);

// Admin only: delete a photo and its local file.
router.delete("/:photoId", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.photoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid photo ID.",
      });
    }

    const photo = await GalleryPhoto.findById(req.params.photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found.",
      });
    }

    const filePath = path.join(uploadDirectory, path.basename(photo.filename));

    await GalleryPhoto.deleteOne({ _id: photo._id });

    fs.unlink(filePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Could not delete gallery image file:", error);
      }
    });

    return res.json({
      success: true,
      message: "Photo deleted successfully.",
    });
  } catch (error) {
    console.error("Gallery delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete the photo.",
    });
  }
});

module.exports = router;
