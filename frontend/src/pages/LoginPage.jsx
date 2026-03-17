import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../context/authStore";

const EyeIcon = ({ show }) =>
  show ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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
    // Store se latest user lo
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }
};

  const switchMethod = (method) => {
    setLoginMethod(method);
    setIdentifier("");
    setErrors({});
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-mark mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="url(#grad2)"/>
              <path d="M16 7l7 4v8l-7 4-7-4V11l7-4z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.9"/>
              <defs><linearGradient id="grad2" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1.5">Sign in to continue to AuthApp</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex p-1 bg-slate-800/60 rounded-xl mb-6 border border-slate-700/50">
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === "email"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📧 Email
          </button>
          <button
            type="button"
            onClick={() => switchMethod("phone")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === "phone"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📱 Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier Field */}
          <div>
            <label className="field-label">
              {loginMethod === "email" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type={loginMethod === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setErrors((p) => ({ ...p, identifier: "" })); }}
              placeholder={loginMethod === "email" ? "you@example.com" : "+91 9876543210"}
              className={`field-input ${errors.identifier ? "field-error" : ""}`}
              autoComplete={loginMethod === "email" ? "email" : "tel"}
            />
            {errors.identifier && <p className="field-msg">{errors.identifier}</p>}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label mb-0">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                placeholder="Your password"
                className={`field-input pr-10 ${errors.password ? "field-error" : ""}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <EyeIcon show={showPassword}/>
              </button>
            </div>
            {errors.password && <p className="field-msg">{errors.password}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading
              ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Signing in...</span>
              : "Sign In →"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
