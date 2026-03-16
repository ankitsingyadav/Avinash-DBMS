import { create } from "zustand";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,

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

  // ── Check Auth — app load pe ek baar, quietly fail ───────────────────────
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/me");
      set({ user: res.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch {
      // Koi retry nahi, koi redirect nahi — bas state reset karo
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