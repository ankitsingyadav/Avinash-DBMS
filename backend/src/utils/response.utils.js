// ─── Success Response ─────────────────────────────────────────────────────────
export const sendSuccess = (res, statusCode = 200, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

// ─── Error Response ───────────────────────────────────────────────────────────
export const sendError = (res, statusCode = 500, message, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

// ─── Async Handler Wrapper ────────────────────────────────────────────────────
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
