// routes/organisation.routes.js
// ─── All permission middlewares properly wired ────────────────────────────────
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  requireRole,
  checkModuleAccess,
  checkActionAccess,
  applyDataScope,
  applyDateRangeScope,
} from "../middleware/permission.middleware.js";

import {
  createOrganisation,
  bulkCreateOrganisations,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  getDistrictsByState,
  getVolunteerDistrictsByState,
} from "../controllers/unifiedOrganisation.controller.js";

import {
  createVolunteer,
  bulkCreateVolunteers,
  getAllVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
} from "../controllers/organisation.controller.js";

const router = express.Router();

// ── All routes require authentication ─────────────────────────────────────────
router.use(protect);

// ── Meta endpoints (no module/action restriction needed) ──────────────────────
router.get("/meta/districts",            requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"), getDistrictsByState);
router.get("/volunteers/meta/districts", requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"), getVolunteerDistrictsByState);

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET  /organisations/volunteers  — list (scoped by role)
router.get(
  "/volunteers",
  checkModuleAccess("volunteer"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getAllVolunteers
);

// GET  /organisations/volunteers/:id
router.get(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getVolunteerById
);

// POST /organisations/volunteers  — create single
router.post(
  "/volunteers",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("add"),
  createVolunteer
);

// POST /organisations/volunteers/bulk
router.post(
  "/volunteers/bulk",
  requireRole("full_admin", "admin"),          // bulk import = full_admin only
  bulkCreateVolunteers
);

// PUT  /organisations/volunteers/:id
router.put(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("edit"),
  updateVolunteer
);

// DELETE /organisations/volunteers/:id
router.delete(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("delete"),
  deleteVolunteer
);

// ─────────────────────────────────────────────────────────────────────────────
// ORGANISATION (CENTRE) ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET  /organisations  — list (scoped by role + centreType)
router.get(
  "/",
  checkModuleAccess("organisation"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getAllOrganisations
);

// GET  /organisations/:id
router.get(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getOrganisationById
);

// POST /organisations  — create single
router.post(
  "/",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("add"),
  createOrganisation
);

// POST /organisations/bulk
router.post(
  "/bulk",
  requireRole("full_admin", "admin"),          // bulk import = full_admin only
  bulkCreateOrganisations
);

// PUT  /organisations/:id
router.put(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("edit"),
  updateOrganisation
);

// DELETE /organisations/:id
router.delete(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("delete"),
  deleteOrganisation
);

export default router;