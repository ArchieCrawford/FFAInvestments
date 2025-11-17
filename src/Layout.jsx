
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "./contexts/AuthContext";

const adminNav = [
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: "fas fa-table" },
  { title: "Members", url: "/admin/members", icon: "fas fa-users" },
  { title: "User Management", url: "/admin/user-management", icon: "fas fa-user-shield" },
  { title: "Member Directory", url: "/member/directory", icon: "fas fa-address-book" },
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
];

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
  const navigationItems = isAdmin ? adminNav : memberNav;

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
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", backgroundColor: "#f7f9fc" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar p-3">
        <h5 className="mb-4">
          <i className="fas fa-dollar-sign me-2 text-primary"></i>
          FFA Investments
          <small className="d-block text-muted">Investment Club Portal</small>
        </h5>

        <nav className="nav flex-column">
          {navigationItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                // Dropdown menu item
                <>
                  <button
                    className={`nav-link btn btn-link text-start w-100 d-flex justify-content-between align-items-center ${
                      isSubmenuActive(item.submenu) ? 'active' : ''
                    }`}
                    onClick={() => toggleSubmenu(item.title)}
                    style={{ border: 'none', textDecoration: 'none' }}
                  >
                    <span>
                      <i className={`${item.icon} me-2`}></i>
                      {item.title}
                    </span>
                    <i className={`fas fa-chevron-${expandedMenus[item.title] ? 'down' : 'right'} ms-auto`}></i>
                  </button>
                  {expandedMenus[item.title] && (
                    <div className="submenu ms-3">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.title}
                          to={subItem.url}
                          className={`nav-link py-2 ${location.pathname === subItem.url ? 'active' : ''}`}
                        >
                          <i className={`${subItem.icon} me-2`}></i>
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Regular menu item
                <Link
                  to={item.url}
                  className={`nav-link ${location.pathname === item.url ? 'active' : ''}`}
                >
                  <i className={`${item.icon} me-2`}></i>
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-5">
          <div className="d-flex align-items-center mb-2">
            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "40px", height: "40px" }}>
              {profile?.display_name?.split(' ').map(n => n[0]).join('') || user?.email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'AC'}
            </div>
            <div>
              <div>{profile?.display_name || user?.email?.split('@')[0] || 'User'}</div>
              <small className="text-muted">
                {user?.email || 'user@example.com'} 
                {profile?.role && <span className="badge bg-primary ms-1">{profile.role}</span>}
              </small>
            </div>
          </div>
          <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content p-4 flex-grow-1">
        {children}
      </div>
    </div>
  );
}