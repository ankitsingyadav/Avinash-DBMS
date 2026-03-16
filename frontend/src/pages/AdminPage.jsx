import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";
import axiosInstance from "../utils/axios";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, admins: 0, activeToday: 0 });

  // Sirf admin access kar sakta hai
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/auth/admin/users");
      setUsers(res.data.users || []);
      setStats({
        total: res.data.users?.length || 0,
        admins: res.data.users?.filter((u) => u.role === "admin").length || 0,
        activeToday: res.data.users?.filter((u) => {
          if (!u.lastLogin) return false;
          const today = new Date();
          const login = new Date(u.lastLogin);
          return login.toDateString() === today.toDateString();
        }).length || 0,
      });
    } catch {
      // API not built yet — show placeholder
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const initials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                ADMIN PANEL
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage all registered users and their roles</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/50 px-4 py-2 rounded-xl transition-all hover:border-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.total, icon: "👥", color: "text-indigo-400" },
            { label: "Admins", value: stats.admins, icon: "🛡️", color: "text-amber-400" },
            { label: "Active Today", value: stats.activeToday, icon: "🟢", color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="auth-card flex items-center gap-4">
              <div className="text-3xl">{s.icon}</div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="auth-card">
          <h2 className="text-white font-semibold text-sm mb-5">All Users</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-400 text-sm">No users found</p>
              <p className="text-slate-600 text-xs mt-1">
                Build <code className="text-indigo-400">GET /api/v1/auth/admin/users</code> route to see users here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {["User", "Email", "Phone", "Age", "Role", "Joined", "Last Login"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/20 transition-colors">
                      {/* User */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                            {u.profileImage?.url ? (
                              <img src={u.profileImage.url} alt={u.fullName} className="w-full h-full object-cover"/>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">{initials(u.fullName)}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-slate-200 font-medium truncate max-w-[120px]">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400 truncate max-w-[150px]">{u.email}</td>
                      <td className="py-3.5 pr-4 text-slate-400">{u.phone}</td>
                      <td className="py-3.5 pr-4 text-slate-400">{u.age}</td>
                      {/* Role Badge */}
                      <td className="py-3.5 pr-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          u.role === "admin"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        }`}>
                          {u.role?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3.5 text-slate-500 text-xs">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-slate-800/60 py-5 text-center">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
