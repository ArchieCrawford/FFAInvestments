import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import Layout from './Layout.jsx'
import Login from './components/Login.jsx'

import ModernLogin from './components/ModernLogin.jsx'
import AuthTest from './components/AuthTest.jsx'
import AuthCallback from './components/AuthCallback.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import AdminUsers from './components/AdminUsersNew.jsx'
import AdminAccounts from './components/AdminAccounts.jsx'
import AdminLedger from './components/AdminLedger.jsx'
import AdminUnitPrice from './components/AdminUnitPriceNew.jsx'
import AdminEducation from './Pages/AdminEducation.jsx'
import AdminImport from './components/AdminImport.jsx'
import AdminMemberManagement from './components/AdminMemberManagement.jsx'
import AdminSettings from './Pages/AdminSettings.jsx'
import AdminMembers from './Pages/AdminMembers.jsx'
import UserManagement from './Pages/UserManagement.jsx'
import MemberDashboard from './Pages/MemberDashboardNew.jsx'
import MemberHome from './Pages/MemberHome.jsx'
import MemberDirectory from './Pages/MemberDirectory.jsx'
import MemberContribute from './Pages/MemberContribute.jsx'
import MemberAccountDashboard from './components/MemberAccountDashboard.jsx'
import EducationCatalog from './Pages/EducationCatalog.jsx'
import UnitValueSystemEducation from './Pages/UnitValueSystemEducation.jsx'
import UnitValueSystemGuide from './Pages/UnitValueSystemGuide.jsx'
import PortfolioBuilder from './Pages/PortfolioBuilder.jsx'
import InviteAccept from './components/InviteAccept.jsx'

// Schwab Integration Components
import AdminSchwab from './Pages/AdminSchwab.jsx'
import AdminPanel from './Pages/AdminPanel.jsx'
import SchwabInsights from './Pages/SchwabInsights.jsx'
import SchwabRawData from './Pages/SchwabRawData.jsx'
import SchwabCallback from './Pages/SchwabCallback.jsx'

// Education Components
import BeardstownLadies from './Pages/BeardstownLadies/index.jsx'

// Additional pages (new)
import MemberFeed from './Pages/MemberFeed/MemberFeed.jsx'
import SettingsPage from './Pages/Settings/SettingsPage.jsx'
import ResetPassword from './Pages/ResetPassword.jsx'

// Admin Components  
import AdminDues from './Pages/AdminDues/index.jsx'
import AdminDebugAuth from './Pages/AdminDebugAuth.jsx'

import { base44 } from './api/base44Client.js'

const queryClient = new QueryClient()

// Initialize app data on startup
const initializeAppData = async () => {
  try {
    // Ensure member data is loaded
    await base44.entities.User.list();
    console.log('App initialized with member data');
  } catch (error) {
    console.error('Failed to initialize app data:', error);
  }
};

function App() {
  useEffect(() => {
    initializeAppData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Debug route to test basic rendering */}
          <Route path="/debug" element={<div style={{padding: '20px', fontSize: '24px', color: 'black'}}>🎯 Debug Route - App is working! Current time: {new Date().toLocaleString()}</div>} />
          
          <Route path="/login" element={<ModernLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/member/home" replace />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navigate to="/member/home" replace />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminDashboard">
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminPanel">
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminUsers">
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/accounts" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminAccounts">
                <AdminAccounts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/ledger" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminLedger">
                <AdminLedger />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/unit-price" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminUnitPrice">
                <AdminUnitPrice />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/education" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminEducation">
                <AdminEducation />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/portfolio-builder" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="PortfolioBuilder">
                <PortfolioBuilder />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/import" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminImport">
                <AdminImport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/manage-members" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminMemberManagement">
                <AdminMemberManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/user-management" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="UserManagement">
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminSettings">
                <AdminSettings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/members" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminMembers">
                <AdminMembers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/schwab" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminSchwab">
                <AdminSchwab />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/schwab/insights" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="SchwabInsights">
                <SchwabInsights />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/schwab/raw-data" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="SchwabRawData">
                <SchwabRawData />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/schwab/callback" element={<SchwabCallback />} />
          <Route path="/member/home" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberHome">
                <MemberHome />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/member/dashboard" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberDashboard">
                <MemberDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/member/contribute" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberContribute">
                <MemberContribute />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/member/directory" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberDirectory">
                <MemberDirectory />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/member/feed" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberFeed">
                <MemberFeed />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/education/catalog" element={
            <ProtectedRoute>
              <EducationCatalog />
            </ProtectedRoute>
          } />
          <Route path="/unit-price" element={
            <ProtectedRoute>
              <Layout currentPageName="UnitPrice">
                <AdminUnitPrice />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/education/unit-value-system" element={
            <ProtectedRoute>
              <UnitValueSystemEducation />
            </ProtectedRoute>
          } />
          <Route path="/education/unit-value-guide" element={
            <ProtectedRoute>
              <UnitValueSystemGuide />
            </ProtectedRoute>
          } />
          <Route path="/education/beardstown-ladies" element={
            <ProtectedRoute>
              <Layout currentPageName="BeardstownLadies">
                <BeardstownLadies />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/dues" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminDues">
                <AdminDues />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout currentPageName="Settings">
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/debug-auth" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout currentPageName="AdminDebugAuth">
                <AdminDebugAuth />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/member/:memberId/dashboard" element={
            <ProtectedRoute>
              <Layout currentPageName="MemberAccount">
                <MemberAccountDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect any unknown routes to login instead of protected root */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App