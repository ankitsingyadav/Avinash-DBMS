import { useState, useRef } from "react";
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

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", age: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3)
      e.fullName = "Full name must be at least 3 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(form.phone))
      e.phone = "Enter a valid phone number (10-15 digits)";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!form.age || form.age < 13 || form.age > 120)
      e.age = "Age must be between 13 and 120";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, image: "Image must be under 5MB" }));
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("profileImage", imageFile);
    const result = await signup(fd);
    if (result.success) navigate("/");
  };

  return (
    <div
      style={{
        background: "#f0f4f8",
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(14,165,233,0.08)",
          borderRadius: "24px",
        }}
        className="w-full max-w-lg p-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            style={{
              width: "52px", height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              boxShadow: "0 6px 20px rgba(14,165,233,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            className="mx-auto mb-4"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M16 7l7 4v8l-7 4-7-4V11l7-4z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Create your account</h1>
          <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>Join thousands of users on AuthApp</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-2">
            <button type="button" onClick={() => fileRef.current.click()} className="relative group">
              <div
                style={{ border: "2.5px solid #bae6fd", outline: "3px solid #f0f9ff" }}
                className="w-20 h-20 rounded-full overflow-hidden transition-all"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover"/>
                ) : (
                  <div style={{ background: "#f0f9ff" }} className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#0ea5e9">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 6px rgba(14,165,233,0.4)",
                }}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </button>
            <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>Profile photo (optional, max 5MB)</p>
            {errors.image && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.image}</p>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Full Name</label>
            <input
              name="fullName" value={form.fullName} onChange={handleChange}
              placeholder="Full Name"
              style={{
                width: "100%", padding: "11px 14px",
                border: errors.fullName ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
                borderRadius: "10px", fontSize: "14px",
                color: "#0f172a", background: errors.fullName ? "#fff7f7" : "#f8fafc",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = errors.fullName ? "#fca5a5" : "#e2e8f0"; e.target.style.background = errors.fullName ? "#fff7f7" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
            />
            {errors.fullName && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#ef4444" }}>⚠ {errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Email Address</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "11px 14px",
                border: errors.email ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
                borderRadius: "10px", fontSize: "14px",
                color: "#0f172a", background: errors.email ? "#fff7f7" : "#f8fafc",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = errors.email ? "#fca5a5" : "#e2e8f0"; e.target.style.background = errors.email ? "#fff7f7" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>⚠ {errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Phone Number</label>
            <input
              name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="+91 9876543210"
              style={{
                width: "100%", padding: "11px 14px",
                border: errors.phone ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
                borderRadius: "10px", fontSize: "14px",
                color: "#0f172a", background: errors.phone ? "#fff7f7" : "#f8fafc",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = errors.phone ? "#fca5a5" : "#e2e8f0"; e.target.style.background = errors.phone ? "#fff7f7" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
            />
            {errors.phone && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>⚠ {errors.phone}</p>}
          </div>

          {/* Age + Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Age</label>
              <input
                name="age" type="number" value={form.age} onChange={handleChange}
                placeholder="25" min="13" max="120"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: errors.age ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
                  borderRadius: "10px", fontSize: "14px",
                  color: "#0f172a", background: errors.age ? "#fff7f7" : "#f8fafc",
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = errors.age ? "#fca5a5" : "#e2e8f0"; e.target.style.background = errors.age ? "#fff7f7" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
              />
              {errors.age && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>⚠ {errors.age}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"} value={form.password}
                  onChange={handleChange} placeholder="Min. 8 characters"
                  style={{
                    width: "100%", padding: "11px 40px 11px 14px",
                    border: errors.password ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
                    borderRadius: "10px", fontSize: "14px",
                    color: "#0f172a", background: errors.password ? "#fff7f7" : "#f8fafc",
                    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? "#fca5a5" : "#e2e8f0"; e.target.style.background = errors.password ? "#fff7f7" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button" onClick={() => setShowPassword((p) => !p)}
                  style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                >
                  <EyeIcon show={showPassword}/>
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>⚠ {errors.password}</p>}
            </div>
          </div>

          {/* Password strength */}
          {form.password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[^A-Za-z0-9]/.test(form.password),
                ].map((ok, i) => (
                  <div
                    key={i}
                    style={{ background: ok ? "#0ea5e9" : "#e2e8f0", transition: "background 0.3s" }}
                    className="h-1 flex-1 rounded-full"
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {form.password.length < 8 ? "Too short" :
                 /[^A-Za-z0-9]/.test(form.password) ? "Strong password 💪" :
                 /[0-9]/.test(form.password) && /[A-Z]/.test(form.password) ? "Good password" : "Add numbers & symbols"}
              </p>
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontSize: "14px", fontWeight: "600", cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(14,165,233,0.35)",
              opacity: isLoading ? 0.7 : 1, fontFamily: "inherit", letterSpacing: "0.01em",
            }}
            className="mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Creating account...
              </span>
            ) : "Create Account →"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0ea5e9", fontWeight: "500", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}