
const crypto = require("crypto");

function requireAdmin(req, res, next) {
  const configuredKey = process.env.ADMIN_KEY;
  const providedKey = req.headers["x-admin-key"];

  if (!configuredKey) {
    return res.status(500).json({
      success: false,
      message: "Admin access is not configured on the server.",
    });
  }

  if (
    typeof providedKey !== "string" ||
    Buffer.byteLength(providedKey, "utf8") !==
      Buffer.byteLength(configuredKey, "utf8")
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  const providedBuffer = Buffer.from(providedKey, "utf8");
  const configuredBuffer = Buffer.from(configuredKey, "utf8");

  if (!crypto.timingSafeEqual(providedBuffer, configuredBuffer)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
}

module.exports = requireAdmin;
