import { create } from "zustand";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const CENTRE_TYPE_MODULES = [
  "School", "College", "NGO", "Corporate", "Online", "Community Centre",
];

// ─── Role helpers (exported, also used by permission-aware components) ─────────
export const roleHelpers = {
  isFullAdmin:    (user) => user?.role === "admin" || user?.role === "full_admin",
  isPartialAdmin: (user) => user?.role === "partial_admin",
  isDataEntry:    (user) => user?.role === "data_entry",

  // canAccess — checks if a user can access a top-level module ("volunteer" | "organisation")
  // FIX: partial_admin ke allowedModules mein "School","NGO" etc. hone par bhi
  // "organisation" module ka access milna chahiye, kyunki ye sub-modules hain.
  canAccess: (user, module) => {
    if (!user) return false;
    if (roleHelpers.isFullAdmin(user)) return true;

    // data_entry: always has access (scoped by ownership at API level)
    if (roleHelpers.isDataEntry(user)) return true;

    const allowed = user.permissions?.allowedModules ?? [];

    // Direct match — e.g. "volunteer" or "organisation"
    if (allowed.includes(module)) return true;

    // Sub-module match — e.g. ["School","NGO"] implies "organisation" access
    if (module === "organisation" && allowed.some((m) => CENTRE_TYPE_MODULES.includes(m))) {
      return true;
    }

    return false;
  },

  canDo: (user, action) => {
    if (!user) return false;
    if (roleHelpers.isFullAdmin(user)) return true;
    return (user.permissions?.allowedActions ?? []).includes(action);
  },

  isFieldHidden: (user, field) => {
    if (!user || roleHelpers.isFullAdmin(user)) return false;
    return (user.permissions?.hiddenFields ?? []).includes(field);
  },

  roleLabel: (user) => {
    const map = {
      admin:         "Full Admin",
      full_admin:    "Full Admin",
      partial_admin: "Partial Admin",
      data_entry:    "Data Entry",
      user:          "User",
    };
    return map[user?.role] || "User";
  },
};

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,

  // ── Convenience selectors (use inside components) ─────────────────────────
  isFullAdmin:    () => roleHelpers.isFullAdmin(get().user),
  isPartialAdmin: () => roleHelpers.isPartialAdmin(get().user),
  isDataEntry:    () => roleHelpers.isDataEntry(get().user),
  canAccess:      (module) => roleHelpers.canAccess(get().user, module),
  canDo:          (action) => roleHelpers.canDo(get().user, action),
  isFieldHidden:  (field)  => roleHelpers.isFieldHidden(get().user, field),
  roleLabel:      ()       => roleHelpers.roleLabel(get().user),

  // ── Signup ───────────────────────────────────────────────────────────────
  signup: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { user, accessToken } = res.data;
      if (accessToken) sessionStorage.setItem("accessToken", accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      toast.success(res.data.message || "Account created successfully!");
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
      return { success: false, message };
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/login", credentials);
      const { user, accessToken } = res.data;
      if (accessToken) sessionStorage.setItem("accessToken", accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      toast.success(res.data.message || "Welcome back!");
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
      return { success: false, message };
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {}
    sessionStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
    toast.success("Logged out successfully.");
  },

  // ── Check Auth ───────────────────────────────────────────────────────────
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/me");
      set({ user: res.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  // ── Forgot Password ──────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      set({ isLoading: false });
      toast.success(res.data.message);
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message || "Something went wrong.";
      toast.error(message);
      return { success: false, message };
    }
  },

  // ── Reset Password ───────────────────────────────────────────────────────
  resetPassword: async (token, data) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.patch(`/auth/reset-password/${token}`, data);
      const { user, accessToken } = res.data;
      if (accessToken) sessionStorage.setItem("accessToken", accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      toast.success(res.data.message || "Password reset successfully!");
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message || "Reset failed.";
      toast.error(message);
      return { success: false, message };
    }
  },

  // ── Update Profile ───────────────────────────────────────────────────────
  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.patch("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: res.data.user, isLoading: false });
      toast.success("Profile updated!");
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message || "Update failed.";
      toast.error(message);
      return { success: false };
    }
  },
}));

export default useAuthStore;