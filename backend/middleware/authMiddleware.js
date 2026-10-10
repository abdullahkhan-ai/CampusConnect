
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
    providedKey.length !== configuredKey.length ||
    !crypto.timingSafeEqual(
      Buffer.from(providedKey),
      Buffer.from(configuredKey)
    )
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
}

module.exports = requireAdmin;
