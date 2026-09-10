const jwt = require("jsonwebtoken");

/**
 * Retrieve the JWT Secret strictly from environment variables.
 * Zero fallback secrets permitted for production security.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    const err = new Error("JWT_SECRET environment variable is not configured.");
    err.code = "JWT_SECRET_NOT_CONFIGURED";
    throw err;
  }
  return secret;
};

/**
 * Middleware: verifyToken
 * Validates JWT bearer token, checks signature, expiration, and payload.
 * Sets req.user upon success.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.trim()) {
    return res.status(401).json({
      message: "Access denied. Authentication token required.",
    });
  }

  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1].trim()) {
    return res.status(401).json({
      message: "Invalid token format. Format must be 'Bearer <token>'.",
    });
  }

  const token = parts[1].trim();

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({
        message: "Malformed token payload. Required user claims missing.",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.code === "JWT_SECRET_NOT_CONFIGURED" || error.message?.includes("JWT_SECRET")) {
      console.error("CRITICAL AUTH ERROR: JWT_SECRET is not configured on server.");
      return res.status(500).json({
        message: "Server authentication misconfigured.",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Authentication token has expired. Please log in again.",
        expiredAt: error.expiredAt,
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    return res.status(401).json({
      message: "Authentication verification failed.",
    });
  }
};

/**
 * Middleware: requireRole
 * Enforces hierarchical role-based access control.
 * Checks that the authenticated user's role is included in allowedRoles.
 */
const requireRole = (...allowedRoles) => {
  const upperRoles = allowedRoles.flat().map((r) => String(r).trim().toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "Authentication required to access this resource.",
      });
    }

    const userRole = String(req.user.role).trim().toUpperCase();

    if (!upperRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: Access denied. Required role: ${upperRoles.join(" or ")}, but your role is '${req.user.role}'.`,
        requiredRoles: upperRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Common role-based access control shortcuts
const requireStudent = requireRole("STUDENT");
const requireFaculty = requireRole("FACULTY");
const requireHod = requireRole("HOD", "ADMIN");
const requireFacultyOrHod = requireRole("FACULTY", "HOD", "ADMIN");

// Attach role helpers to the primary verifyToken function for backwards compatibility
verifyToken.verifyToken = verifyToken;
verifyToken.getJwtSecret = getJwtSecret;
verifyToken.requireRole = requireRole;
verifyToken.requireStudent = requireStudent;
verifyToken.requireFaculty = requireFaculty;
verifyToken.requireHod = requireHod;
verifyToken.requireFacultyOrHod = requireFacultyOrHod;

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.getJwtSecret = getJwtSecret;
module.exports.requireRole = requireRole;
module.exports.requireStudent = requireStudent;
module.exports.requireFaculty = requireFaculty;
module.exports.requireHod = requireHod;
module.exports.requireFacultyOrHod = requireFacultyOrHod;