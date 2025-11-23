
import React, { useState, useEffect } from "react";
import ThemeToggle from "./components/ThemeToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "./contexts/AuthContext";

const adminNav = [
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: "fas fa-table" },
  { title: "Members", url: "/admin/members", icon: "fas fa-users" },
  { title: "User Management", url: "/admin/user-management", icon: "fas fa-user-shield" },
  { title: "Member Directory", url: "/member/directory", icon: "fas fa-address-book" },
  { title: "Member Feed", url: "/member/feed", icon: "fas fa-comments" },
  { title: "Accounts", url: createPageUrl("AdminAccounts"), icon: "fas fa-user-circle" },
  { title: "Dues Tracker", url: "/admin/dues", icon: "fas fa-money-check-alt" },
  { title: "Ledger", url: createPageUrl("AdminLedger"), icon: "fas fa-book" },
  { title: "Unit Price", url: createPageUrl("AdminUnitPrice"), icon: "fas fa-chart-line" },
  { title: "Portfolio Builder", url: "/admin/portfolio-builder", icon: "fas fa-briefcase" },
  { 
    title: "Education", 
    icon: "fas fa-graduation-cap", 
    submenu: [
      { title: "Lesson Management", url: createPageUrl("AdminEducation"), icon: "fas fa-chalkboard-teacher" },
      { title: "Beardstown Ladies Guide", url: "/education/beardstown-ladies", icon: "fas fa-book-open" },
    ]
  },
  { title: "Import Data", url: createPageUrl("AdminImport"), icon: "fas fa-upload" },
  { title: "FFA Import", url: createPageUrl("AdminFFAImport"), icon: "fas fa-file-import" },
  { title: "Settings", url: "/admin/settings", icon: "fas fa-cog" },
  { 
    title: "Charles Schwab", 
    icon: "fas fa-university", 
    submenu: [
      { title: "Connection & Overview", url: "/admin/schwab", icon: "fas fa-link" },
      { title: "Account Insights", url: "/admin/schwab/insights", icon: "fas fa-chart-pie" },
      { title: "Raw Data Viewer", url: "/admin/schwab/raw-data", icon: "fas fa-code" },
    ]
  },
];

const memberNav = [
  { title: "Dashboard", url: "/member/dashboard", icon: "fas fa-table" },
  { title: "Member Directory", url: "/member/directory", icon: "fas fa-address-book" },
  { title: "My Accounts", url: createPageUrl("MemberAccounts"), icon: "fas fa-wallet" },
  { title: "Make Contribution", url: createPageUrl("MemberContribute"), icon: "fas fa-dollar-sign" },
  { title: "Unit Price", url: "/unit-price", icon: "fas fa-chart-line" },
  { title: "Settings", url: "/settings", icon: "fas fa-cog" },
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
];

const BackgroundAnimation = () => (
  <div className="app-bg-animation">
    <div className="app-bg-shape app-bg-shape-1"></div>
    <div className="app-bg-shape app-bg-shape-2"></div>
    <div className="app-bg-shape app-bg-shape-3"></div>
    <div className="app-bg-shape app-bg-shape-4"></div>
  </div>
);

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleLogout = async () => {
    await signOut();
  };

  const toggleSubmenu = (title) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.url);
  };

  const isAdmin = profile?.role === 'admin';
  // If admin, show both admin and member navigation items (deduplicated by URL)
  const navigationItems = isAdmin
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

  // Initialize expanded state for active submenus
  useEffect(() => {
    if (navigationItems) {
      const initialExpanded = {};
      navigationItems.forEach(item => {
        if (item.submenu && isSubmenuActive(item.submenu)) {
          initialExpanded[item.title] = true;
        }
      });
      setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [location.pathname, navigationItems]);

  // If user is a member, redirect them to their own dashboard
  React.useEffect(() => {
    if (user && user.role === 'member' && location.pathname.startsWith('/admin/')) {
      navigate(`/member/${user.id}/dashboard`);
    }
  }, [user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="app-shell">
        <BackgroundAnimation />
        <div className="fullscreen-center">
          <div className="spinner-page" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <BackgroundAnimation />
      <div className="app-main">
        <aside className="app-sidebar">
          <div className="app-brand">
            <div className="app-brand-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div>
              <p className="app-brand-title">FFA Investments</p>
              <p className="app-brand-subtitle">Investment Club Portal</p>
            </div>
          </div>

          <nav className="app-nav">
            {navigationItems.map((item) => (
              <div key={item.title} className="app-nav-item">
                {item.submenu ? (
                  <>
                    <button
                      type="button"
                      className={`app-nav-link has-children ${isSubmenuActive(item.submenu) ? 'active' : ''}`}
                      onClick={() => toggleSubmenu(item.title)}
                      aria-expanded={!!expandedMenus[item.title]}
                    >
                      <span className="app-nav-link-label">
                        <i className={`${item.icon} app-nav-icon`} aria-hidden="true"></i>
                        {item.title}
                      </span>
                      <span className="app-nav-chevron" aria-hidden="true">
                        <i className={`fas fa-chevron-${expandedMenus[item.title] ? 'down' : 'right'}`}></i>
                      </span>
                    </button>
                    {expandedMenus[item.title] && (
                      <div className="app-submenu">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.title}
                            to={subItem.url}
                            className={`app-nav-link sub ${location.pathname === subItem.url ? 'active' : ''}`}
                            aria-current={location.pathname === subItem.url ? 'page' : undefined}
                          >
                            <span className="app-nav-link-label">
                              <i className={`${subItem.icon} app-nav-icon`} aria-hidden="true"></i>
                              {subItem.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.url}
                    className={`app-nav-link ${location.pathname === item.url ? 'active' : ''}`}
                    aria-current={location.pathname === item.url ? 'page' : undefined}
                  >
                    <span className="app-nav-link-label">
                      <i className={`${item.icon} app-nav-icon`} aria-hidden="true"></i>
                      {item.title}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="app-user-panel">
            <div className="app-user-card">
              <div className="app-user-avatar">
                {profile?.display_name?.split(' ').map(n => n[0]).join('') ||
                  user?.email?.split('@')[0]?.substring(0, 2).toUpperCase() ||
                  'AC'}
              </div>
              <div>
                <p className="app-user-name">{profile?.display_name || user?.email?.split('@')[0] || 'User'}</p>
                <p className="app-user-email">
                  {user?.email || 'user@example.com'}
                  {profile?.role && <span className="app-role-badge">{profile.role}</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
              <ThemeToggle />
                <button className="app-btn app-btn-danger app-btn-pill app-signout" onClick={handleLogout}>
                  Sign Out
                </button>
            </div>
          </div>
        </aside>

        <main className="app-content">
          <div className="app-page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
