
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    studentId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    passId: {
      type: String,
      default: randomUUID,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A student email can register only once per event.
registrationSchema.index(
  { event: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Registration",
  registrationSchema
);
