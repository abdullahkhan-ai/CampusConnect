
const express = require("express");
const mongoose = require("mongoose");

const Event = require("../models/Event");
const Registration = require("../models/Registration");

const router = express.Router();

// POST /api/registrations
// Public student registration. No student login is required.
router.post("/", async (req, res) => {
  try {
    const { eventId, studentName, email, studentId } = req.body;

    if (
      !mongoose.isValidObjectId(eventId) ||
      typeof studentName !== "string" ||
      !studentName.trim() ||
      studentName.trim().length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254 ||
      typeof studentId !== "string" ||
      !studentId.trim() ||
      studentId.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid event, student name, email, and student ID.",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.status !== "Registration Open") {
      return res.status(400).json({
        success: false,
        message: "Registration is not open for this event.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Registration.findOne({
      event: event._id,
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered for this event.",
      });
    }

    const registration = await Registration.create({
      event: event._id,
      studentName: studentName.trim(),
      email: normalizedEmail,
      studentId: studentId.trim(),
    });

    // Update the registration count without replacing the event.
    await Event.updateOne(
      { _id: event._id },
      { $inc: { registrations: 1 } }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      registration: {
        id: registration._id,
        passId: registration.passId,
        studentName: registration.studentName,
        email: registration.email,
        studentId: registration.studentId,
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
        },
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered for this event.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Could not complete registration. Please try again.",
    });
  }
});

// GET /api/registrations/:passId
// Return only the minimum details needed to display a pass.
router.get("/:passId", async (req, res) => {
  try {
    const registration = await Registration.findOne({
      passId: req.params.passId,
    }).populate("event", "title date time venue status");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Entry pass not found.",
      });
    }

    return res.json({
      success: true,
      registration: {
        passId: registration.passId,
        studentName: registration.studentName,
        event: registration.event,
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error("Entry pass lookup error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve the entry pass.",
    });
  }
});

module.exports = router;
