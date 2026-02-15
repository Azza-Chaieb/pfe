// src/AdminApp.jsx - NOUVEAU FICHIER
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importe les composants admin
import { AdminLayout } from './admin/components/layout/AdminLayout.jsx';
import Dashboard from './admin/components/layout/pages/Dashboard.jsx';
import Users from './admin/components/layout/pages/Users.jsx';
import Settings from './admin/components/layout/pages/Settings.jsx';
import Login from './admin/components/layout/pages/Login.jsx';
import SpaceManagement from './admin/components/layout/pages/SpaceManagement.jsx';

// Importe les styles admin
import './admin/styles/admin.css';

// Composant de protection de route
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('jwt');

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

// Composant principal des routes admin
const AdminApp = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Routes protégées */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="spaces" element={<SpaceManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AdminApp;