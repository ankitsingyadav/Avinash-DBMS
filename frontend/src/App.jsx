import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./context/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";

// ── Organisation imports ──────────────────────────────────────────
import OrganisationPage   from "./pages/OrganisationPage";
import SchoolFormPage     from "./pages/SchoolFormPage";
import CollegeFormPage    from "./pages/CollegeFormPage";
import NGOFormPage        from "./pages/NGOFormPage";
import VolunteerFormPage  from "./pages/VolunteerFormPage";

export default function App() {
  const { checkAuth, isAuthenticated, isCheckingAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin-only route wrapper — reusable helper
  const AdminOnly = ({ children }) => (
    <ProtectedRoute>
      {user?.role === "admin" ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e1e2e",
            color: "#e2e8f0",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "10px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>

        {/* ── Public ─────────────────────────────────────────────── */}
        <Route path="/"      element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* ── Auth ───────────────────────────────────────────────── */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* ── Authenticated user ─────────────────────────────────── */}
        <Route
          path="/profile"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />

        {/* ── Admin only ─────────────────────────────────────────── */}
        <Route path="/dashboard" element={<AdminOnly><DashboardPage /></AdminOnly>} />
        <Route path="/admin"     element={<AdminOnly><AdminPage /></AdminOnly>} />

        {/* ── Organisation (admin only) ──────────────────────────── */}
        <Route path="/organisation"          element={<AdminOnly><OrganisationPage /></AdminOnly>} />
        <Route path="/organisation/school"   element={<AdminOnly><SchoolFormPage /></AdminOnly>} />
        <Route path="/organisation/college"  element={<AdminOnly><CollegeFormPage /></AdminOnly>} />
        <Route path="/organisation/ngo"      element={<AdminOnly><NGOFormPage /></AdminOnly>} />
        <Route path="/organisation/volunteer" element={<AdminOnly><VolunteerFormPage /></AdminOnly>} />

        {/* ── Fallback ───────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}