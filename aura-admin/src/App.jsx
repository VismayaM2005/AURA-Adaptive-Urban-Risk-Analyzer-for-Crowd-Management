import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Components
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

// Layout Components
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";

// Pages
import DashboardPage from "./pages/DashboardPage";
import ApprovedRoutesPage from "./pages/ApprovedRoutesPage";
import AlertsPage from "./pages/AlertsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PlaybackPage from "./pages/PlaybackPage";

import "./App.css";

// ---------------------------
// Protected Dashboard Layout
// ---------------------------
function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto">
        <Header alertCount={0} />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-2">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="col-span-10">
            {activeTab === "dashboard" && <DashboardPage />}
            {activeTab === "alerts" && <AlertsPage />}
            {activeTab === "playback" && <PlaybackPage />}
            {activeTab === "approved-routes" && <ApprovedRoutesPage />}
            {activeTab === "analytics" && <AnalyticsPage />}
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
}

// ---------------------------
// Protected Route
// ---------------------------
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// ---------------------------
// Main App
// ---------------------------
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
