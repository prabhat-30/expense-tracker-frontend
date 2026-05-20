import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import SystemHealth from "./pages/SystemHealth";

import SystemSettings from "./pages/SystemSettings";
import CategoryManager from "./pages/CategoryManager";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";


// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

// User Pages
import Dashboard from "./pages/Dashboard";
import AllExpenses from "./pages/AllExpenses";
import Profile from "./pages/Profile";
import BulkAddExpenses from "./pages/BulkAddExpenses";
import Analytics from "./pages/Analytics";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";

// Route Guards
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import AuditLogs from "./pages/AuditLogs";
import SecurityLogs from "./pages/SecurityLogs";

import BudgetsDashboard from "./pages/BudgetsDashboard";



export default function App() {
  const { token, role, loading } = useAuth();

  // Prevent flicker during auth check
  if (loading) {
    return <div className="loading-container"><h2 className="loading-text">Loading...</h2></div>;
  }

  return (
    <Routes>

      <Route path="/admin/health" element={<AdminRoute><SystemHealth /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><CategoryManager /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
      {/* Public Auth Routes */}
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* 🌟 FIXED: Registered Forgot Password link dispatch console page within public routing tree map */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Root Path - Redirects based on Role */}
      <Route
        path="/"
        element={
          token
            ? (role === "ADMIN" ? <Navigate to="/admin" replace /> : <Navigate to="/user" replace />)
            : <Navigate to="/login" replace />
        }
      />

      {/* Protected User Routes */}
      <Route path="/user" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><AllExpenses /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><BudgetsDashboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/bulk-add" element={<ProtectedRoute><BulkAddExpenses /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />

      {/* NEW: Audit Logs Route */}
      <Route path="/admin/logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />

      {/* App.jsx - Fix this line */}
      <Route path="/security-logs" element={<ProtectedRoute><SecurityLogs /></ProtectedRoute>} />

      {/* 404 Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}