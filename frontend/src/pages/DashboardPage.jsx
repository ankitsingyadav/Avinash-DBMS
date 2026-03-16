import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";

export default function DashboardPage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    age: user?.age || "",
  });
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (form.fullName !== user.fullName) fd.append("fullName", form.fullName);
    if (form.phone !== user.phone) fd.append("phone", form.phone);
    if (form.age !== user.age) fd.append("age", form.age);
    if (imageFile) fd.append("profileImage", imageFile);
    const result = await updateProfile(fd);
    if (result.success) {
      setEditMode(false);
      setPreview(null);
      setImageFile(null);
    }
  };

  const avatarUrl = preview || user?.profileImage?.url;
  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">

        <div className="auth-card mb-4">
          <div className="flex items-start gap-5 mb-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-indigo-500/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{initials}</span>
                  </div>
                )}
              </div>
              {editMode && (
                <button type="button" onClick={() => fileRef.current.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-[#0f0f18] hover:bg-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold text-white truncate">{user?.fullName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                  user?.role === "admin"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <p className="text-slate-500 text-sm">{user?.phone}</p>
            </div>

            <button onClick={() => setEditMode((p) => !p)}
              className={`text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                editMode
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
              }`}>
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Age", value: user?.age ? `${user.age} yrs` : "—" },
              { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—" },
              { label: "Last login", value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
                <p className="text-white font-semibold text-sm">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {editMode && (
            <form onSubmit={handleUpdate} className="space-y-3 pt-4 border-t border-slate-700/50">
              <p className="text-sm font-medium text-slate-300 mb-3">Update Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Full Name</label>
                  <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="field-input" placeholder="Full name"/>
                </div>
                <div>
                  <label className="field-label">Age</label>
                  <input type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} className="field-input" placeholder="Age" min="13" max="120"/>
                </div>
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="field-input" placeholder="+91 9876543210"/>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Saving...</span> : "Save Changes →"}
              </button>
            </form>
          )}
        </div>

        <div className="auth-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Security</h3>
          <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
            <div>
              <p className="text-sm text-slate-200 font-medium">Password</p>
              <p className="text-xs text-slate-500 mt-0.5">Change your account password</p>
            </div>
            <button onClick={() => navigate("/login")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Change →</button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-slate-200 font-medium">Account Status</p>
              <p className="text-xs text-slate-500 mt-0.5">Your account is active and secure</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>Active
            </span>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800/60 py-5 text-center">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
