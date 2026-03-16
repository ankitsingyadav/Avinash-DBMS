import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: "Too many password reset requests. Please try again after 1 hour." },
});

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post("/signup", authLimiter, upload.single("profileImage"), signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);

// ─── Protected Routes (require login) ────────────────────────────────────────
router.use(protect); // All routes below require authentication

router.post("/logout", logout);
router.get("/me", getMe);
router.patch("/update-profile", upload.single("profileImage"), updateProfile);
router.patch("/change-password", changePassword);

export default router;
