/**
 * Standardized API Response Helper
 */

function sendSuccess(res, data = null, message = "Operation completed successfully.", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(Array.isArray(data) ? { count: data.length } : {}),
  });
}

function sendCreated(res, data = null, message = "Resource created successfully.") {
  return sendSuccess(res, data, message, 201);
}

function sendError(res, message = "An error occurred during request execution.", statusCode = 400, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

function sendUnauthorized(res, message = "Access denied. Authentication token required or invalid.") {
  return sendError(res, message, 401);
}

function sendForbidden(res, message = "Forbidden. Access denied for your current role permissions.") {
  return sendError(res, message, 403);
}

function sendNotFound(res, message = "Requested resource not found.") {
  return sendError(res, message, 404);
}

function sendConflict(res, message = "Conflict. A resource with these attributes already exists.") {
  return res.status(409).json({
    success: false,
    message,
    conflict: true,
  });
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
};
