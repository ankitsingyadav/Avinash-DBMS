import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await resetPassword(token, form);
    if (result.success) navigate("/dashboard");
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#6366f1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
          <p className="text-slate-400 text-sm mt-2">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">New Password</label>
            <div className="relative">
              <input
                type={show.password ? "text" : "password"}
                value={form.password}
                onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: "" })); }}
                placeholder="Min. 8 characters"
                className={`field-input pr-10 ${errors.password ? "field-error" : ""}`}
                autoFocus
              />
              <button type="button" onClick={() => setShow((p) => ({ ...p, password: !p.password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                <EyeIcon show={show.password}/>
              </button>
            </div>
            {errors.password && <p className="field-msg">{errors.password}</p>}
          </div>

          {/* Password strength indicator */}
          {form.password && (
            <div className="flex gap-1">
              {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].map((ok, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-indigo-500" : "bg-slate-700"}`}/>
              ))}
            </div>
          )}

          <div>
            <label className="field-label">Confirm New Password</label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => { setForm((p) => ({ ...p, confirmPassword: e.target.value })); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                placeholder="Repeat your password"
                className={`field-input pr-10 ${errors.confirmPassword ? "field-error" : ""}`}
              />
              <button type="button" onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                <EyeIcon show={show.confirm}/>
              </button>
            </div>
            {errors.confirmPassword && <p className="field-msg">{errors.confirmPassword}</p>}
            {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Passwords match
              </p>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading
              ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Resetting...</span>
              : "Reset Password →"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
