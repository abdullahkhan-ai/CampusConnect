
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "WORKSHOP",
        "TECHNOLOGY",
        "CULTURAL",
        "SEMINAR",
        "COMPETITION",
        "SPORTS",
      ],
      default: "WORKSHOP",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      default: "",
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: [
        "Registration Open",
        "Coming Soon",
        "Registration Closed",
        "Completed",
        "Cancelled",
      ],
      default: "Registration Open",
    },
    registrations: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      enum: ["blue", "purple", "orange"],
      default: "blue",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
