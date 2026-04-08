// routes/organisation.routes.js
import express from "express";

import {
  createVolunteer,
  bulkCreateVolunteers,
  getAllVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
} from "../controllers/organisation.controller.js";

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

import { protect } from "../middleware/auth.middleware.js";
import {
  requireRole,
  checkModuleAccess,
  checkActionAccess,
  applyDataScope,
  applyDateRangeScope,
} from "../middleware/permission.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Apply data + date scope on every request (middleware reads role internally)
router.use(applyDataScope);
router.use(applyDateRangeScope);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: All literal/static sub-paths MUST come before "/:id" routes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Meta ──────────────────────────────────────────────────────────────────────
router.get("/meta/districts",            getDistrictsByState);
router.get("/volunteers/meta/districts", getVolunteerDistrictsByState);

// ── Volunteers ────────────────────────────────────────────────────────────────

// Bulk import — full_admin only
router.post(
  "/volunteers/bulk",
  requireRole("admin", "full_admin"),
  checkModuleAccess("volunteer"),
  checkActionAccess("add"),
  bulkCreateVolunteers
);

// List + create
router.route("/volunteers")
  .get(
    checkModuleAccess("volunteer"),
    checkActionAccess("view"),
    getAllVolunteers
  )
  .post(
    checkModuleAccess("volunteer"),
    checkActionAccess("add"),
    createVolunteer
  );

// Single record
router.route("/volunteers/:id")
  .get(
    checkModuleAccess("volunteer"),
    checkActionAccess("view"),
    getVolunteerById
  )
  .put(
    checkModuleAccess("volunteer"),
    checkActionAccess("edit"),
    updateVolunteer
  )
  .delete(
    checkModuleAccess("volunteer"),
    checkActionAccess("delete"),
    deleteVolunteer
  );

// ── Organisations ─────────────────────────────────────────────────────────────

// Bulk import — full_admin only
router.post(
  "/bulk",
  requireRole("admin", "full_admin"),
  checkModuleAccess("organisation"),
  checkActionAccess("add"),
  bulkCreateOrganisations
);

// List + create
router.route("/")
  .get(
    checkModuleAccess("organisation"),
    checkActionAccess("view"),
    getAllOrganisations
  )
  .post(
    checkModuleAccess("organisation"),
    checkActionAccess("add"),
    createOrganisation
  );

// Single record
router.route("/:id")
  .get(
    checkModuleAccess("organisation"),
    checkActionAccess("view"),
    getOrganisationById
  )
  .put(
    checkModuleAccess("organisation"),
    checkActionAccess("edit"),
    updateOrganisation
  )
  .delete(
    checkModuleAccess("organisation"),
    checkActionAccess("delete"),
    deleteOrganisation
  );

export default router;