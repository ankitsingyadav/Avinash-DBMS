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
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-mark mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="url(#grad1)"/>
              <path d="M16 7l7 4v8l-7 4-7-4V11l7-4z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.9"/>
              <defs><linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1.5">Join thousands of users on AuthApp</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-2">
            <button type="button" onClick={() => fileRef.current.click()} className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-[#0f0f18] transition-all group-hover:ring-indigo-500">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6366f1">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-[#0f0f18]">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="white">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            </button>
            <p className="text-xs text-slate-500 mt-2">Profile photo (optional, max 5MB)</p>
            {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image}</p>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>
          </div>

          {/* Full Name */}
          <div>
            <label className="field-label">Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange}
              placeholder="Avinash Kumar" className={`field-input ${errors.fullName ? "field-error" : ""}`}/>
            {errors.fullName && <p className="field-msg">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="field-label">Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" className={`field-input ${errors.email ? "field-error" : ""}`}/>
            {errors.email && <p className="field-msg">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="field-label">Phone Number</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="+91 9876543210" className={`field-input ${errors.phone ? "field-error" : ""}`}/>
            {errors.phone && <p className="field-msg">{errors.phone}</p>}
          </div>

          {/* Age + Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange}
                placeholder="25" min="13" max="120" className={`field-input ${errors.age ? "field-error" : ""}`}/>
              {errors.age && <p className="field-msg">{errors.age}</p>}
            </div>
            <div>
              <label className="field-label">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} value={form.password}
                  onChange={handleChange} placeholder="Min. 8 characters"
                  className={`field-input pr-10 ${errors.password ? "field-error" : ""}`}/>
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  <EyeIcon show={showPassword}/>
                </button>
              </div>
              {errors.password && <p className="field-msg">{errors.password}</p>}
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
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-indigo-500" : "bg-slate-700"}`}/>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {form.password.length < 8 ? "Too short" :
                 /[^A-Za-z0-9]/.test(form.password) ? "Strong password 💪" :
                 /[0-9]/.test(form.password) && /[A-Z]/.test(form.password) ? "Good password" : "Add numbers & symbols"}
              </p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Creating account...</span> : "Create Account →"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
