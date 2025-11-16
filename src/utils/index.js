export const createPageUrl = (pageName) => {
  // Simple page URL creator - you can customize this based on your routing needs
  const pageRoutes = {
    'AdminDashboard': '/admin/dashboard',
    'AdminUsers': '/admin/users',
    'AdminAccounts': '/admin/accounts',
    'AdminLedger': '/admin/ledger',
    'AdminUnitPrice': '/admin/unit-price',
    'AdminEducation': '/admin/education',
    'AdminImport': '/admin/import',
    'AdminFFAImport': '/admin/ffa-import',
    'AdminSchwab': '/admin/schwab',
    'MemberDashboard': '/member/dashboard',
    'MemberAccounts': '/member/accounts',
    'MemberContribute': '/member/contribute',
    'EducationCatalog': '/education/catalog'
  };
  
  return pageRoutes[pageName] || `/${pageName.toLowerCase()}`;
};