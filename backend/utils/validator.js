/**
 * Input Validation & Parameter Sanitization Utility
 */

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr.trim())) return false;
  const d = new Date(dateStr.trim());
  return !isNaN(d.getTime());
}

function validateTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return false;
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return regex.test(timeStr.trim());
}

function validateRequiredFields(body, requiredFields = []) {
  const missing = [];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
      missing.push(field);
    }
  }
  return missing;
}

module.exports = {
  validateEmail,
  validateDate,
  validateTime,
  validateRequiredFields,
};
