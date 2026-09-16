import React, { useState } from "react";

export function DashboardLayout({
  user,
  onLogout,
  onToggleRole,
  navItems = [],
  activeTab,
  onTabChange,
  title = "LectureLog",
  subtitle = "Academic Portal",
  children,
  actionButton,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // For bottom navigation on mobile (first 4 items)
  const bottomNavItems = navItems.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-border-default px-2.5 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-surface-bright/95 backdrop-blur-md z-40">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-primary p-2 -ml-1 cursor-pointer rounded-lg hover:bg-surface-container active:scale-95 transition-transform shrink-0"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div className="flex items-baseline gap-1.5 sm:gap-2 truncate">
            <span className="font-greeting-serif text-lg sm:text-2xl tracking-tight text-primary font-bold truncate">
              {title}
            </span>
            {user?.role && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 sm:hidden shrink-0">
                {user.role}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U"}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-primary leading-tight">
                {user?.full_name || "User"}
              </span>
              <span className="text-[10px] text-text-stone capitalize leading-none">
                {user?.role || "Student"}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 sm:px-2.5 sm:py-1 text-text-muted hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-xs font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <nav
        className={`bg-surface-warm h-screen w-[82vw] max-w-xs sm:w-64 fixed left-0 top-0 border-r border-border-default flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out shadow-2xl md:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-border-default shrink-0">
            <div className="truncate">
              <span className="font-greeting-serif text-headline-md tracking-tight text-on-surface leading-none font-bold block truncate">
                {title}
              </span>
              <span className="font-label-sm text-[10px] text-text-stone tracking-wider uppercase mt-1 block truncate">
                {subtitle}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-2 text-text-muted hover:text-primary rounded-lg hover:bg-surface-container shrink-0 ml-2"
              aria-label="Close Navigation Menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {actionButton && <div className="p-4 border-b border-border-default shrink-0">{actionButton}</div>}

          <div className="py-3 flex-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || activeTab === item.altId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 sm:px-6 py-3 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "border-secondary bg-surface-container text-on-surface font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                    <span className="text-sm truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-success/20 text-success shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User profile info in drawer footer for mobile */}
          <div className="p-4 border-t border-border-default bg-surface-container/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary truncate">{user?.full_name || "User"}</p>
                <p className="text-[11px] text-text-stone truncate">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Workspace Canvas */}
      <main className="md:ml-64 px-3 py-4 sm:px-6 sm:py-6 md:p-8 max-w-[1400px] mx-auto w-full flex-1 pb-24 md:pb-12 min-w-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {bottomNavItems.length > 1 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-bright/95 backdrop-blur-md border-t border-border-default z-30 flex items-center justify-around px-1 py-1 safe-bottom-padding shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.id || activeTab === item.altId;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg text-[9px] sm:text-[10px] font-medium transition-colors flex-1 min-w-0 ${
                  isActive
                    ? "text-secondary font-bold"
                    : "text-text-muted hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{item.icon}</span>
                <span className="truncate max-w-[56px] sm:max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-[9px] sm:text-[10px] font-medium text-text-muted hover:text-primary flex-1 min-w-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">more_horiz</span>
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  );
}

