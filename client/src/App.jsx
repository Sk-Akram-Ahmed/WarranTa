import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WarrantyForm from './pages/WarrantyForm';
import WarrantyDetail from './pages/WarrantyDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties/new"
            element={
              <ProtectedRoute>
                <WarrantyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties/:id"
            element={
              <ProtectedRoute>
                <WarrantyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties/:id/edit"
            element={
              <ProtectedRoute>
                <WarrantyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
