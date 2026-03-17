import crypto from "crypto";
import User from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  cookieOptions,
  refreshCookieOptions,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import {
  sendEmail,
  forgotPasswordTemplate,
  welcomeTemplate,
  passwordChangedTemplate,
} from "../utils/email.utils.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middleware/upload.middleware.js";

// ─── Helper: Attach tokens to response ───────────────────────────────────────
const sendTokenResponse = async (user, statusCode, res, message) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Set cookies
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // Remove sensitive fields from response
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;

  return sendSuccess(res, statusCode, message, {
    user: { ...userObj, avatar: user.avatar },
    accessToken,
  });
};

// ─── SIGNUP ───────────────────────────────────────────────────────────────────
export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, age } = req.body;

  // Validate required fields
  if (!fullName || !email || !phone || !password || !age) {
    return sendError(res, 422, "All fields are required: fullName, email, phone, password, age");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      return sendError(res, 409, "An account with this email already exists.");
    }
    return sendError(res, 409, "An account with this phone number already exists.");
  }

  // Handle profile image upload
  let profileImage = { public_id: null, url: null };
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "auth-app/avatars");
      profileImage = { public_id: result.public_id, url: result.secure_url };
    } catch (err) {
      console.error("Profile image upload failed:", err.message);
      // Continue signup without image
    }
  }

  // Create user (role defaults to 'user' internally)
  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    age: parseInt(age),
    profileImage,
    role: "user", // Always user — never from request body
  });

  // Send welcome email (non-blocking)
  sendEmail({
    to: user.email,
    subject: "Welcome to DataBase Management! ",
    html: welcomeTemplate({ name: user.fullName }),
  }).catch((err) => console.error("Welcome email failed:", err.message));

  return sendTokenResponse(user, 201, res, "Account created successfully! Welcome aboard 🎉");
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { identifier, password, loginMethod } = req.body;
  // loginMethod: 'email' | 'phone'

  if (!identifier || !password) {
    return sendError(res, 422, "Please provide your credentials and password.");
  }

  // Build query based on login method
  let query;
  if (loginMethod === "phone") {
    if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(identifier)) {
      return sendError(res, 422, "Please provide a valid phone number.");
    }
    query = { phone: identifier };
  } else {
    // Default: email login
    query = { email: identifier.toLowerCase().trim() };
  }

  // Find user with password
  const user = await User.findOne(query).select("+password +refreshToken");

  if (!user) {
    return sendError(res, 401, "Invalid credentials. Please check and try again.");
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 403, "Your account has been deactivated. Contact support.");
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return sendError(res, 401, "Invalid credentials. Please check and try again.");
  }

  return sendTokenResponse(user, 200, res, "Login successful! Welcome back 👋");
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return sendSuccess(res, 200, "Logged out successfully.");
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  return sendSuccess(res, 200, "User retrieved successfully", {
    user: { ...user.toObject(), avatar: user.avatar },
  });
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return sendError(res, 401, "No refresh token found. Please login again.");
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    return sendError(res, 401, "Invalid refresh token. Please login again.");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  res.cookie("accessToken", accessToken, cookieOptions);

  return sendSuccess(res, 200, "Token refreshed successfully", { accessToken });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 422, "Please provide your registered email address.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // SECURITY: Always return success (don't reveal if email exists)
  if (!user) {
    return sendSuccess(
      res,
      200,
      "If an account with that email exists, a password reset link has been sent."
    );
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Build reset URL
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request — AuthApp",
      html: forgotPasswordTemplate({
        name: user.fullName,
        resetURL,
        expiresIn: "15 minutes",
      }),
    });

    return sendSuccess(
      res,
      200,
      "Password reset link has been sent to your email. Please check your inbox."
    );
  } catch (err) {
    // Roll back token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return sendError(
      res,
      500,
      "Failed to send reset email. Please try again later."
    );
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return sendError(res, 422, "Please provide password and confirm password.");
  }

  if (password !== confirmPassword) {
    return sendError(res, 422, "Passwords do not match.");
  }

  if (password.length < 8) {
    return sendError(res, 422, "Password must be at least 8 characters.");
  }

  // Hash the raw token to compare with DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid token that hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return sendError(
      res,
      400,
      "Password reset link is invalid or has expired. Please request a new one."
    );
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send confirmation email
  sendEmail({
    to: user.email,
    subject: "Your password has been changed — AuthApp",
    html: passwordChangedTemplate({ name: user.fullName }),
  }).catch((err) => console.error("Password changed email failed:", err.message));

  return sendTokenResponse(user, 200, res, "Password reset successfully! You are now logged in.");
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, age } = req.body;
  const user = await User.findById(req.user._id);

  // Handle profile image update
  if (req.file) {
    // Delete old image from Cloudinary
    if (user.profileImage?.public_id) {
      await deleteFromCloudinary(user.profileImage.public_id);
    }

    const result = await uploadToCloudinary(req.file.buffer, "auth-app/avatars");
    user.profileImage = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  if (fullName) user.fullName = fullName.trim();
  if (phone) user.phone = phone.trim();
  if (age) user.age = parseInt(age);

  await user.save();

  return sendSuccess(res, 200, "Profile updated successfully", {
    user: { ...user.toObject(), avatar: user.avatar },
  });
});

// ─── CHANGE PASSWORD (logged in) ─────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return sendError(res, 422, "Please provide all password fields.");
  }

  if (newPassword !== confirmPassword) {
    return sendError(res, 422, "New passwords do not match.");
  }

  if (newPassword.length < 8) {
    return sendError(res, 422, "New password must be at least 8 characters.");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isCorrect = await user.comparePassword(currentPassword);

  if (!isCorrect) {
    return sendError(res, 401, "Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 200, "Password changed successfully.");
});
