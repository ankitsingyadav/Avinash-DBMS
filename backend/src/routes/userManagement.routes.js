// routes/userManagement.routes.js
import express from "express";
import {
  getAllUsers,
  createManagedUser,
  updateUserPermissions,
  toggleUserStatus,
  deleteUser,
} from "../controllers/userManagement.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/permission.middleware.js";

const router = express.Router();

// All routes require authentication + full_admin role
router.use(protect);
router.use(requireRole("full_admin", "admin"));

router.route("/")
  .get  (getAllUsers)
  .post (createManagedUser);

router.patch("/:id/permissions", updateUserPermissions);
router.patch("/:id/status",      toggleUserStatus);
router.delete("/:id",            deleteUser);

export default router;
