import React, { useState } from "react";

export function DashboardLayout({
  user,
  onLogout,
  onToggleRole,
  navItems,
  activeTab,
  onTabChange,
  title = "LectureLog",
  subtitle = "Academic Portal",
  children,
  actionButton,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      {/* Top Header */}
      <header className="h-16 border-b border-border-default px-4 md:px-8 flex items-center justify-between sticky top-0 bg-surface-bright/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary p-2 cursor-pointer rounded hover:bg-surface-container"
            title="Toggle Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          <span className="font-greeting-serif text-2xl tracking-tight text-primary font-bold hidden sm:inline">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {onToggleRole && (
            <div className="flex items-center bg-surface-container border border-border-default rounded px-2.5 py-1 text-xs font-medium">
              <span className="text-text-stone mr-1 font-semibold hidden sm:inline">Portal:</span>
              <select
                value={user?.role || "STUDENT"}
                onChange={(e) => onToggleRole(e.target.value)}
                className="bg-transparent text-primary font-bold cursor-pointer focus:outline-none"
                title="Switch application portal preview"
              >
                <option value="STUDENT">Student Portal</option>
                <option value="FACULTY">Faculty Portal</option>
                <option value="HOD">HOD Portal</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U"}
            </div>
            <span className="text-xs font-bold text-primary hidden md:inline">
              {user?.full_name || "User"}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error-container/20 rounded transition-colors cursor-pointer"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <nav
        className={`bg-surface-warm h-screen w-64 fixed left-0 top-0 border-r border-border-default flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          <div className="h-16 px-6 flex flex-col justify-center border-b border-border-default">
            <span className="font-greeting-serif text-headline-md tracking-tight text-on-surface leading-none font-bold">
              {title}
            </span>
            <span className="font-label-sm text-[10px] text-text-stone tracking-wider uppercase mt-1">
              {subtitle}
            </span>
          </div>

          {actionButton && <div className="p-4 border-b border-border-default">{actionButton}</div>}

          <div className="py-3 flex flex-col overflow-y-auto max-h-[calc(100vh-200px)]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || activeTab === item.altId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "border-secondary bg-surface-container text-on-surface font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-success/20 text-success">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Workspace Canvas */}
      <main className="md:ml-64 p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen pb-24">
        {children}
      </main>
    </div>
  );
}
