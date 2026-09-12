import React from "react";

export function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return (
      <div className="p-8 text-center bg-surface-warm border border-border-default rounded">
        <h3 className="font-serif-display text-xl text-primary font-bold mb-2">Authentication Required</h3>
        <p className="text-sm text-text-stone">Please log in with appropriate institutional credentials to access this portal.</p>
      </div>
    );
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center bg-error-container/10 border border-error/30 rounded">
        <h3 className="font-serif-display text-xl text-error font-bold mb-2">Access Forbidden (403)</h3>
        <p className="text-sm text-text-stone">Your role ({user.role}) is not authorized to view this portal workspace.</p>
      </div>
    );
  }

  return children;
}
