import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./context/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/Scrolltop";
import RouteChangeLoader from "./components/RouteChangeLoader";

// ── Lazy imports ──────────────────────────────────────────────
const SignupPage           = lazy(() => import("./pages/SignupPage"));
const LoginPage            = lazy(() => import("./pages/LoginPage"));
const ForgotPasswordPage   = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage    = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage        = lazy(() => import("./pages/DashboardPage"));
const HomePage             = lazy(() => import("./pages/HomePage"));
const ProfilePage          = lazy(() => import("./pages/Profilepage"));
const AboutPage            = lazy(() => import("./pages/AboutPage"));
const AdminPage            = lazy(() => import("./pages/AdminPage"));
const OrganisationPage     = lazy(() => import("./pages/OrganisationPage"));
const VolunteerFormPage    = lazy(() => import("./pages/VolunteerFormPage"));
const OrganisationFormPage = lazy(() => import("./pages/OrganisationFormPage"));

// ── Page loader (Suspense fallback - pehli baar load ke liye) ─
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0c0c14",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "2px solid #6366f1",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Admin Only Guard ──────────────────────────────────────────
const AdminOnly = ({ children }) => {
  const { user } = useAuthStore();
  return (
    <ProtectedRoute>
      {user?.role === "admin" ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
};

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { checkAuth, isAuthenticated, isCheckingAuth } = useAuthStore();

  useEffect(() => { checkAuth(); }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <BrowserRouter>
      <ScrollToTop />
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

      <Suspense fallback={<PageLoader />}>
        {/* ── Har route change pe loader dikhega ── */}
        <RouteChangeLoader />

        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route path="/signup"
            element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />}
          />

          <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />

          <Route path="/dashboard"
            element={<AdminOnly><DashboardPage /></AdminOnly>}
          />
          <Route path="/admin"
            element={<AdminOnly><AdminPage /></AdminOnly>}
          />
          <Route path="/organisation"
  element={<ProtectedRoute><OrganisationPage /></ProtectedRoute>}
/>
<Route path="/organisation/add"
  element={<AdminOnly><OrganisationFormPage /></AdminOnly>}
/>
<Route path="/organisation/volunteer"
  element={<AdminOnly><VolunteerFormPage /></AdminOnly>}
/>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}