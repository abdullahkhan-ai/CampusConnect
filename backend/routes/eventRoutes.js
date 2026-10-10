
const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

const allowedCategories = [
  "WORKSHOP",
  "TECHNOLOGY",
  "CULTURAL",
  "SEMINAR",
  "COMPETITION",
  "SPORTS",
];

const allowedStatuses = [
  "Registration Open",
  "Coming Soon",
  "Registration Closed",
  "Completed",
  "Cancelled",
];

const allowedColors = ["blue", "purple", "orange"];

function validateEvent(body, partial = false) {
  const errors = [];

  if (!partial || body.title !== undefined) {
    if (
      typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 100
    ) {
      errors.push("Title is required and must be at most 100 characters.");
    }
  }

  if (!partial || body.description !== undefined) {
    if (
      typeof body.description !== "string" ||
      !body.description.trim() ||
      body.description.trim().length > 1000
    ) {
      errors.push(
        "Description is required and must be at most 1000 characters."
      );
    }
  }

  if (!partial || body.category !== undefined) {
    if (!allowedCategories.includes(body.category)) {
      errors.push("Please provide a valid event category.");
    }
  }

  if (!partial || body.date !== undefined) {
    if (
      typeof body.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
      !Number.isFinite(Date.parse(`${body.date}T00:00:00.000Z`)) ||
      new Date(`${body.date}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== body.date
    ) {
      errors.push("A valid event date in YYYY-MM-DD format is required.");
    }
  }

  if (!partial || body.venue !== undefined) {
    if (
      typeof body.venue !== "string" ||
      !body.venue.trim() ||
      body.venue.trim().length > 200
    ) {
      errors.push("Venue is required and must be at most 200 characters.");
    }
  }

  if (body.time !== undefined && typeof body.time !== "string") {
    errors.push("Time must be a string.");
  }

  if (
    body.time &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)
  ) {
    errors.push("Time must use 24-hour HH:mm format.");
  }

  if (
    body.status !== undefined &&
    !allowedStatuses.includes(body.status)
  ) {
    errors.push("Please provide a valid event status.");
  }

  if (
    body.color !== undefined &&
    !allowedColors.includes(body.color)
  ) {
    errors.push("Please provide a valid event color.");
  }

  return errors;
}

// GET /api/events
// Public: anyone can view all events.
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({
      date: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Get events error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve events.",
    });
  }
});

// GET /api/events/:id
// Public: anyone can view an individual event.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Get event error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve this event.",
    });
  }
});

// POST /api/events
// Admin only: create an event.
router.post("/", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateEvent(body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the event details.",
        errors,
      });
    }

    const event = await Event.create({
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      date: new Date(`${body.date}T00:00:00.000Z`),
      time: body.time || "",
      venue: body.venue.trim(),
      status: body.status || "Registration Open",
      color: body.color || "blue",
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Create event error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create the event.",
    });
  }
});

// PUT /api/events/:id
// Admin only: update an event.
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const body = req.body || {};
    const errors = validateEvent(body, true);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the event details.",
        errors,
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "date",
      "time",
      "venue",
      "status",
      "color",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.venue !== undefined) {
      updates.venue = updates.venue.trim();
    }

    if (updates.date !== undefined) {
      updates.date = new Date(`${updates.date}T00:00:00.000Z`);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Update event error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update the event.",
    });
  }
});

// DELETE /api/events/:id
// Admin only: delete an event.
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Delete event error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the event.",
    });
  }
});

module.exports = router;
