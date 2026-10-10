
const mongoose = require("mongoose");

const galleryPhotoSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    contentType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryPhoto", galleryPhotoSchema);
