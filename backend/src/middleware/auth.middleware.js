import { verifyAccessToken } from "../utils/jwt.utils.js";
import User from "../models/user.model.js";
import { sendError } from "../utils/response.utils.js";

// ─── Protect Routes - Verify JWT ──────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check HttpOnly cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 401, "You are not logged in. Please login to access this route.");
    }

    // 3. Verify token
    const decoded = verifyAccessToken(token);

    // 4. Check if user still exists
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user) {
      return sendError(res, 401, "The user belonging to this token no longer exists.");
    }

    // 5. Check if account is active
    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Please contact support.");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token. Please login again.");
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Your session has expired. Please login again.");
    }
    return sendError(res, 500, "Authentication error. Please try again.");
  }
};

// ─── Role-Based Access Control ────────────────────────────────────────────────
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        "You do not have permission to perform this action."
      );
    }
    next();
  };
};
