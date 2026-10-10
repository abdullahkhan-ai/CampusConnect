
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function register({ name, email, password }) {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    throw new Error("Please enter a valid name.");
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 254
  ) {
    throw new Error("Please enter a valid email address.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new Error("Password must be between 8 and 72 characters.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "student",
  });

  return {
    user: publicUser(user),
    token: createToken(user),
  };
}

async function login({ email, password }) {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new Error("Please enter your email and password.");
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password.");
  }

  return {
    user: publicUser(user),
    token: createToken(user),
  };
}

module.exports = {
  register,
  login,
};
