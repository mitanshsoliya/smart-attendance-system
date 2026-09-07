const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }
  return secret;
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied. Token required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token format",
    });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.message?.includes("JWT_SECRET")) {
      return res.status(500).json({
        message: "Server authentication misconfigured",
      });
    }

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = verifyToken;