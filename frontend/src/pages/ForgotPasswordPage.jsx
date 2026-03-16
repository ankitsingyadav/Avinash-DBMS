import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../context/authStore";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }

    const result = await forgotPassword(email);
    if (result.success) setSent(true);
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Enter the email linked to your account.<br/>We'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Registered Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className={`field-input ${error ? "field-error" : ""}`}
                  autoFocus
                />
                {error && <p className="field-msg">{error}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading
                  ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Sending link...</span>
                  : "Send Reset Link →"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                ← Back to login
              </Link>
            </p>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#10b981">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-1">
              We've sent a password reset link to
            </p>
            <p className="text-indigo-400 font-medium text-sm mb-5">{email}</p>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              The link will expire in <span className="text-amber-400">15 minutes</span>. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2"
            >
              Try a different email
            </button>
            <div className="mt-4">
              <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                ← Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
