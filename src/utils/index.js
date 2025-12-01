export const createPageUrl = (pageName) => {
  // Simple page URL creator - you can customize this based on your routing needs
  const pageRoutes = {
    'AdminDashboard': '/admin/dashboard',
    'AdminUsers': '/admin/users',
    'AdminAccounts': '/admin/accounts',
    'AdminLedger': '/admin/ledger',
    'AdminUnitPrice': '/admin/unit-price',
    'AdminEducation': '/admin/education',
    'AdminSchwab': '/admin/schwab',
    'MemberDashboard': '/member/dashboard',
    'MemberContribute': '/member/contribute',
    'EducationCatalog': '/education/catalog'
  };
  
  return pageRoutes[pageName] || `/${pageName.toLowerCase()}`;
};