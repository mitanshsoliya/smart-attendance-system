/**
 * Date, Time, and Status Formatting Utilities
 */

export function formatDateDisplay(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTimeOnly(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getStatusBadgeStyle(status) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
    case "PRESENT":
    case "CLEARED":
      return "bg-success/20 text-success border-success/30";
    case "UPCOMING":
    case "ADVISORY":
      return "bg-secondary/15 text-secondary border-secondary/30";
    case "COMPLETED":
    case "ABSENT":
    case "INACTIVE":
      return "bg-surface-container text-text-stone border-border-default";
    case "CRITICAL":
    case "WITHHELD":
    case "DISQUALIFIED":
      return "bg-error-container/30 text-error border-error/30";
    default:
      return "bg-surface-container text-text-stone border-border-default";
  }
}
