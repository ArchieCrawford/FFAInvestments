
import React, { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "./contexts/AuthContext";

const adminNav = [
  // === Dashboard ===
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: "fas fa-table" },
  { title: "Partner Dashboard", url: "/admin/dashboard", icon: "fas fa-chart-line" },
  
  // === Members ===
  { title: "Members", url: "/admin/members", icon: "fas fa-users" },
  { title: "User Management", url: "/admin/user-management", icon: "fas fa-user-shield" },
  { title: "Member Feed", url: "/member/feed", icon: "fas fa-comments" },
  
  // === Club Management ===
  { title: "Accounts / Positions", url: "/admin/accounts", icon: "fas fa-briefcase" },
  { title: 'Documents', url: '/admin/documents', icon: 'fa-regular fa-folder' },
  { title: "Dues", url: "/admin/dues", icon: "fas fa-money-check-alt" },
  { title: "Ledger", url: createPageUrl("AdminLedger"), icon: "fas fa-book" },
  { title: "Unit Price", url: "/admin/unit-price", icon: "fas fa-chart-line" },
  { title: "Portfolio Builder", url: "/admin/portfolio-builder", icon: "fas fa-briefcase" },
  { 
    title: "Education", 
    icon: "fas fa-graduation-cap", 
    submenu: [
      { title: "Lesson Management", url: createPageUrl("AdminEducation"), icon: "fas fa-chalkboard-teacher" },
      { title: "Beardstown Ladies Guide", url: "/education/beardstown-ladies", icon: "fas fa-book-open" },
    ]
  },
  { title: "Settings", url: "/admin/settings", icon: "fas fa-cog" },
  { title: "Schwab Integration", url: "/admin/schwab", icon: "fas fa-university" },
  { title: "Schwab Insights", url: "/admin/schwab/insights", icon: "fas fa-chart-pie" },
  { title: "Schwab Raw Data", url: "/admin/schwab/raw-data", icon: "fas fa-code" },
  { title: "Login Activity", url: "/admin/login-activity", icon: "fas fa-user-clock" },
];

const memberNav = [
  { title: "Home", url: "/member/accounts", icon: "fas fa-home" },
  { title: "Partner Dashboard", url: "/admin/dashboard", icon: "fas fa-chart-line" },
  { title: "My Dashboard", url: "/member/dashboard", icon: "fas fa-table" },
  { 
    title: "Education", 
    icon: "fas fa-graduation-cap", 
    submenu: [
      { title: "Lesson Catalog", url: createPageUrl("EducationCatalog"), icon: "fas fa-list" },
      { title: "Beardstown Ladies Guide", url: "/education/beardstown-ladies", icon: "fas fa-book-open" },
      { title: "Unit Calculator", url: "/education/unit-value-system", icon: "fas fa-calculator" },
      { title: "Complete Unit Guide", url: "/education/unit-value-guide", icon: "fas fa-book" },
    ]
  },
  { title: "Member Feed", url: "/member/feed", icon: "fas fa-comments" },
  { title: "Make Contribution", url: createPageUrl("MemberContribute"), icon: "fas fa-dollar-sign" },
  { title: "Accounts / Positions", url: "/admin/accounts", icon: "fas fa-briefcase" },
  { title: "Settings", url: "/settings", icon: "fas fa-cog" },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  const toggleSubmenu = (title) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.url);
  };

  // Use the AuthContext helper when available to determine admin status.
  const showAdmin = (typeof isAdmin === 'function') ? isAdmin() : (profile?.role === 'admin');

  // If admin, show both admin and member navigation items (deduplicated by URL)
  const navigationItems = showAdmin
    ? (() => {
        const seen = new Set();
        const merged = [];
        for (const it of adminNav.concat(memberNav)) {
          if (!seen.has(it.url)) {
            merged.push(it);
            seen.add(it.url);
          }
        }
        return merged;
      })()
    : memberNav;

  // Resolve any dynamic member dashboard links that need the current user id
  const resolvedNavigationItems = navigationItems;

  const renderNavItems = () => (
    resolvedNavigationItems.map((item) => (
      <div key={item.title} className="mb-1">
        {item.submenu ? (
          <>
            <button
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isSubmenuActive(item.submenu) 
                  ? 'bg-primary text-white' 
                  : 'text-default hover:bg-primary-soft'
              }`}
              onClick={() => toggleSubmenu(item.title)}
              aria-expanded={!!expandedMenus[item.title]}
            >
              <span className="flex items-center gap-2">
                <i className={`${item.icon} w-5`} aria-hidden="true"></i>
                {item.title}
              </span>
              <i className={`fas fa-chevron-${expandedMenus[item.title] ? 'down' : 'right'} text-xs`} aria-hidden="true"></i>
            </button>
            {expandedMenus[item.title] && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.title}
                    to={subItem.url}
                    onClick={closeMobileNav}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      location.pathname === subItem.url 
                        ? 'bg-primary text-white' 
                        : 'text-muted hover:bg-primary-soft hover:text-default'
                    }`}
                    aria-current={location.pathname === subItem.url ? 'page' : undefined}
                  >
                    <i className={`${subItem.icon} w-5`} aria-hidden="true"></i>
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={item.url}
            onClick={closeMobileNav}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === item.url 
                ? 'bg-primary text-white' 
                : 'text-default hover:bg-primary-soft'
            }`}
            aria-current={location.pathname === item.url ? 'page' : undefined}
          >
            <i className={`${item.icon} w-5`} aria-hidden="true"></i>
            {item.title}
          </Link>
        )}
      </div>
    ))
  );

  // Initialize expanded state for active submenus
  useEffect(() => {
    if (resolvedNavigationItems) {
      const initialExpanded = {};
      resolvedNavigationItems.forEach(item => {
        if (item.submenu && isSubmenuActive(item.submenu)) {
          initialExpanded[item.title] = true;
        }
      });
      setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [location.pathname, resolvedNavigationItems]);

  // If user is a member, redirect them to their home page when hitting admin routes
  React.useEffect(() => {
    if (user && profile?.role === 'member' && location.pathname.startsWith('/admin/')) {
      navigate('/member/accounts', { replace: true });
    }
  }, [user, profile, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-surface border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-dollar-sign text-white"></i>
            </div>
            <div>
              <p className="font-bold text-lg text-default">FFA Investments</p>
              <p className="text-sm text-muted">Investment Club Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {renderNavItems()}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center text-sm font-semibold text-default">
              {profile?.display_name?.split(' ').map(n => n[0]).join('') ||
                user?.email?.split('@')[0]?.substring(0, 2).toUpperCase() ||
                'AC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-default truncate">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted truncate">
                {user?.email || 'user@example.com'}
              </p>
              {profile?.role && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-white">
                  {profile.role}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <button 
              className="btn-primary-soft border border-border rounded-full px-3 py-1.5 text-sm font-medium w-full" 
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Drawer */}
      <div
        className={`${isMobileNavOpen ? 'fixed' : 'hidden'} md:hidden inset-0 z-40 bg-black/50`}
        onClick={closeMobileNav}
      ></div>
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-dollar-sign text-white"></i>
            </div>
            <div>
              <p className="font-bold text-lg text-default">FFA Investments</p>
              <p className="text-sm text-muted">Investment Club Portal</p>
            </div>
          </div>
          <button
            type="button"
            className="text-default"
            onClick={closeMobileNav}
            aria-label="Close navigation"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {renderNavItems()}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center text-sm font-semibold text-default">
              {profile?.display_name?.split(' ').map(n => n[0]).join('') ||
                user?.email?.split('@')[0]?.substring(0, 2).toUpperCase() ||
                'AC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-default truncate">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted truncate">
                {user?.email || 'user@example.com'}
              </p>
              {profile?.role && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-white">
                  {profile.role}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <button 
              className="btn-primary-soft border border-border rounded-full px-3 py-1.5 text-sm font-medium w-full" 
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-x-hidden">
        <header className="md:hidden flex items-center justify-between bg-surface border-b border-border px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-default"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <p className="font-semibold text-default">FFA Investments</p>
              <p className="text-xs text-muted">Investment Club Portal</p>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
