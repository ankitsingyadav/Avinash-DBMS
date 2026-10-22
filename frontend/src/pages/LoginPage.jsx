import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../context/authStore";

const EyeIcon = ({ show }) =>
  show ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

const inputBase = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#0f172a",
  background: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s",
  fontFamily: "inherit",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [loginMethod, setLoginMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const validate = () => {
    const e = {};
    if (!identifier.trim()) {
      e.identifier = loginMethod === "email" ? "Email is required" : "Phone number is required";
    } else if (loginMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      e.identifier = "Enter a valid email address";
    } else if (loginMethod === "phone" && !/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(identifier)) {
      e.identifier = "Enter a valid phone number";
    }
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login({ identifier, password, loginMethod });
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === "admin") navigate("/dashboard");
      else navigate("/");
    }
  };

  const switchMethod = (method) => {
    setLoginMethod(method);
    setIdentifier("");
    setErrors({});
  };

  const getInputStyle = (field) => ({
    ...inputBase,
    ...(focusedField === field
      ? { borderColor: "#0ea5e9", background: "#fff", boxShadow: "0 0 0 3px rgba(14,165,233,0.1)" }
      : errors[field]
      ? { borderColor: "#fca5a5", background: "#fff7f7" }
      : {}),
  });

  return (
    <div style={{
      background: "#f0f4f8",
      backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        padding: "2.5rem 2.25rem",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(14,165,233,0.08)",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "52px", height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 6px 20px rgba(14,165,233,0.3)",
          }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M16 7l7 4v8l-7 4-7-4V11l7-4z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.95" />
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#f0f9ff", color: "#0369a1",
              border: "1px solid #bae6fd",
              borderRadius: "100px", padding: "4px 12px",
              fontSize: "12px", fontWeight: "500",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0ea5e9", display: "inline-block" }} />
              Secure Login
            </span>
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 1.75rem" }}>
            Sign in to continue to DB Manager
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex", background: "#f8fafc",
          borderRadius: "12px", padding: "4px",
          marginBottom: "1.5rem", border: "1px solid #e2e8f0",
        }}>
          {["email", "phone"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMethod(m)}
              style={{
                flex: 1, padding: "9px 12px",
                fontSize: "13px", fontWeight: "500",
                border: loginMethod === m ? "1px solid #bae6fd" : "1px solid transparent",
                borderRadius: "9px", cursor: "pointer",
                transition: "all 0.2s",
                background: loginMethod === m ? "#ffffff" : "transparent",
                color: loginMethod === m ? "#0ea5e9" : "#94a3b8",
                boxShadow: loginMethod === m ? "0 1px 4px rgba(14,165,233,0.12)" : "none",
              }}
            >
              {m === "email" ? "📧 Email" : "📱 Phone"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Identifier */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              {loginMethod === "email" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type={loginMethod === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setErrors((p) => ({ ...p, identifier: "" })); }}
              onFocus={() => setFocusedField("identifier")}
              onBlur={() => setFocusedField(null)}
              placeholder={loginMethod === "email" ? "you@example.com" : "+91 9876543210"}
              autoComplete={loginMethod === "email" ? "email" : "tel"}
              style={getInputStyle("identifier")}
            />
            {errors.identifier && (
              <p style={{ fontSize: "12px", color: "#ef4444", margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errors.identifier}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: "12px", color: "#0ea5e9", textDecoration: "none", fontWeight: "500" }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ ...getInputStyle("password"), paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", display: "flex", alignItems: "center", padding: 0,
                }}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: "12px", color: "#ef4444", margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              color: "#fff", border: "none",
              borderRadius: "10px", fontSize: "14px", fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "4px",
              boxShadow: "0 4px 14px rgba(14,165,233,0.35)",
              letterSpacing: "0.01em",
              opacity: isLoading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Signing in...
              </span>
            ) : "Sign In →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", margin: "1.25rem 0 0" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: "500" }}>
            Create Account
          </Link>
        </p>

        {/* Trust Row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "16px", marginTop: "1.5rem", paddingTop: "1.25rem",
          borderTop: "1px solid #f1f5f9",
        }}>
          {[
            { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />, label: "SSL Encrypted" },
            { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, label: "Secure & Private" },
            { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />, label: "Verified" },
          ].map(({ icon, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#94a3b8" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#0ea5e9" strokeWidth="2">{icon}</svg>
              {label}
            </span>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}