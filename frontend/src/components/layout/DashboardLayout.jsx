import React, { useState, useEffect } from "react";

export function DashboardLayout({
  user,
  onLogout,
  onToggleRole,
  navItems = [],
  activeTab,
  onTabChange,
  title = "Smart Attendance System",
  subtitle = "Campus Management Portal",
  children,
  actionButton,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("lecturelog_sidebar_collapsed") === "true";
  });
  const [currentDateString, setCurrentDateString] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDateString(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("lecturelog_sidebar_collapsed", String(next));
      return next;
    });
  };

  const userRole = (user?.role || "STUDENT").toUpperCase();
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Role-specific badge theme
  const roleBadgeStyle = {
    STUDENT: "bg-blue-50 text-blue-700 border-blue-200",
    FACULTY: "bg-indigo-50 text-indigo-700 border-indigo-200",
    HOD: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  }[userRole] || "bg-slate-100 text-slate-700 border-slate-200";

  const departmentName =
    user?.department ||
    user?.profile?.department ||
    "Department of Computer Science & Engineering";

  const bottomNavItems = navItems.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 font-sans flex flex-col antialiased">
      {/* ========================================================
          DESKTOP SIDEBAR NAVIGATION (Collapsible: 260px <-> 72px)
         ======================================================== */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/90 z-30 transition-all duration-200 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center w-full" : ""}`}>
            {/* University Crest / App Icon */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight truncate">
                  Smart Attendance
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block leading-tight mt-0.5 truncate">
                  Campus Platform
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">first_page</span>
            </button>
          )}
        </div>

        {/* Action Button Container */}
        {actionButton && !isCollapsed && (
          <div className="p-3.5 border-b border-slate-100 shrink-0">{actionButton}</div>
        )}

        {/* Collapsed Toggle Button when collapsed */}
        {isCollapsed && (
          <div className="py-2 flex justify-center border-b border-slate-100">
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">last_page</span>
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <div className="py-3 px-2.5 flex-1 overflow-y-auto custom-scrollbar space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || activeTab === item.altId;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-3 group relative ${
                  isActive
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {!isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {/* Tooltip for collapsed view */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User Card / Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {user?.full_name || "User"}
                  </p>
                  <span
                    className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border mt-0.5 ${roleBadgeStyle}`}
                  >
                    {userRole}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Sign out of campus terminal"
                aria-label="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================
          STICKY TOP HEADER
         ======================================================== */}
      <header
        className={`h-16 border-b border-slate-200/90 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20 transition-all duration-200 ease-in-out ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Left Side: Mobile Menu Button & Brand / Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-slate-700 p-2 -ml-1 cursor-pointer rounded-xl hover:bg-slate-100 active:scale-95 transition-transform shrink-0"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary md:hidden flex items-center justify-center text-white shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-base">account_balance</span>
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate leading-tight">
                {title}
              </h1>
              <p className="text-[11px] text-slate-500 truncate leading-none mt-0.5 hidden sm:block">
                {departmentName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Campus Pulse, Date, Role Pill, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Live Campus Pulse Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Campus Engine Online</span>
          </div>

          {/* Current Academic Date */}
          {currentDateString && (
            <span className="hidden xl:inline-block text-xs font-medium text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg">
              📅 {currentDateString}
            </span>
          )}

          {/* Active Role Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadgeStyle}`}
          >
            {userRole}
          </span>

          {/* User Menu Trigger */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user?.full_name ? user.full_name.split(" ")[0] : "User"}
              </span>
              <span className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
                {userRole.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Sign out of system"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="text-xs font-semibold hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MOBILE SLIDE-OUT DRAWER NAVIGATION
         ======================================================== */}
      <nav
        className={`bg-white h-screen w-[82vw] max-w-xs fixed left-0 top-0 border-r border-slate-200 flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out shadow-2xl md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div className="truncate">
                <span className="text-sm font-extrabold text-slate-900 block leading-tight truncate">
                  Smart Attendance
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block leading-tight mt-0.5 truncate">
                  {subtitle}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 shrink-0"
              aria-label="Close Navigation Menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Action Button for mobile */}
          {actionButton && <div className="p-3.5 border-b border-slate-100 shrink-0">{actionButton}</div>}

          {/* Navigation Items */}
          <div className="py-3 px-3 flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || activeTab === item.altId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-primary text-white shadow-xs font-bold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Drawer Footer User Profile */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || "User"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${roleBadgeStyle}`}>
                {userRole}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-2 px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ========================================================
          MAIN CONTENT CANVAS
         ======================================================== */}
      <main
        className={`flex-1 transition-all duration-200 ease-in-out px-3 py-4 sm:px-6 sm:py-6 md:px-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-12 min-w-0 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {children}
      </main>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION BAR
         ======================================================== */}
      {bottomNavItems.length > 1 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around px-1 py-1 safe-bottom-padding shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.id || activeTab === item.altId;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-colors flex-1 min-w-0 ${
                  isActive
                    ? "text-blue-700 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-900 flex-1 min-w-0"
          >
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  );
}


