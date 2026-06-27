// routes/organisation.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  requireRole,
  checkModuleAccess,
  checkActionAccess,
  applyDataScope,
  applyDateRangeScope,
} from "../middleware/permission.middleware.js";

// ── Unified Organisation controller (centres + interactions + duplicate check) ─
import {
  createOrganisation,
  bulkCreateOrganisations,
  bulkCheckDuplicates,
  lookupByPincode,
  mergeOrganisations,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  getDistrictsByState,
  getVolunteerDistrictsByState,
  addInteraction,
  getInteractions,
} from "../controllers/unifiedOrganisation.controller.js";

// ── Volunteer controller ───────────────────────────────────────────────────────
import {
  createVolunteer,
  bulkCreateVolunteers,
  getAllVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
  getUpcomingInteractions,
  cancelNextInteraction,
} from "../controllers/organisation.controller.js";

const router = express.Router();

// ── Global auth guard — applies to every route below ─────────────────────────
router.use(protect);

// ═════════════════════════════════════════════════════════════════════════════
// META ENDPOINTS
// Must come before any parameterised routes
// ═════════════════════════════════════════════════════════════════════════════

router.get(
  "/meta/districts",
  requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"),
  getDistrictsByState,
);

router.get(
  "/volunteers/meta/districts",
  requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"),
  getVolunteerDistrictsByState,
);

// ═════════════════════════════════════════════════════════════════════════════
// VOLUNTEER ROUTES
// Static paths (/volunteers, /volunteers/bulk) MUST precede /volunteers/:id
// ═════════════════════════════════════════════════════════════════════════════

router.get(
  "/volunteers",
  checkModuleAccess("volunteer"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getAllVolunteers,
);

router.post(
  "/volunteers/bulk",
  requireRole("full_admin", "admin"),
  bulkCreateVolunteers,
);

router.post(
  "/volunteers",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("add"),
  createVolunteer,
);

router.get(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getVolunteerById,
);

router.put(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("edit"),
  updateVolunteer,
);

router.delete(
  "/volunteers/:id",
  checkModuleAccess("volunteer"),
  applyDataScope,
  checkActionAccess("delete"),
  deleteVolunteer,
);

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATION / UTILITY ROUTES
// Fully static — must come before /:id routes
// ═════════════════════════════════════════════════════════════════════════════

// Bell icon — interactions due in next 48 h
router.get(
  "/upcoming-interactions",
  checkModuleAccess("organisation"),
  checkActionAccess("view"),
  getUpcomingInteractions,
);

// ═════════════════════════════════════════════════════════════════════════════
// PINCODE LOOKUP
// Fully static path — must come before /:id routes
// ═════════════════════════════════════════════════════════════════════════════

router.get(
  "/lookup/pincode",
  checkModuleAccess("organisation"),
  checkActionAccess("view"),
  lookupByPincode,
);

// ═════════════════════════════════════════════════════════════════════════════
// ORGANISATION BULK ROUTES
// /bulk/check-duplicates MUST come before /bulk so Express doesn't swallow
// "check-duplicates" as the body of the /bulk route, and both must come before
// the /:id family.
// ═════════════════════════════════════════════════════════════════════════════

router.post(
  "/bulk/check-duplicates",
  requireRole("full_admin", "admin"),
  bulkCheckDuplicates,
);

router.post(
  "/bulk",
  requireRole("full_admin", "admin"),
  bulkCreateOrganisations,
);

// ═════════════════════════════════════════════════════════════════════════════
// ORGANISATION INTERACTION SUB-ROUTES
// /:id/interactions* — static suffix, but still parameterised by :id.
// Must come before the plain /:id CRUD routes so Express resolves correctly.
// ═════════════════════════════════════════════════════════════════════════════

router.get(
  "/:id/interactions",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("view"),
  getInteractions,
);

router.post(
  "/:id/interactions",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("edit"),
  addInteraction,
);

router.post(
  "/:id/interactions/cancel",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("edit"),
  cancelNextInteraction,
);

router.post(
  "/:id/merge",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("edit"),
  mergeOrganisations,
);

// ═════════════════════════════════════════════════════════════════════════════
// ORGANISATION CRUD
// Plain /:id routes — must be last so nothing above gets shadowed
// ═════════════════════════════════════════════════════════════════════════════

router.get(
  "/",
  checkModuleAccess("organisation"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getAllOrganisations,
);

router.post(
  "/",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("add"),
  createOrganisation,
);

router.get(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  applyDateRangeScope,
  checkActionAccess("view"),
  getOrganisationById,
);

router.put(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("edit"),
  updateOrganisation,
);

router.delete(
  "/:id",
  checkModuleAccess("organisation"),
  applyDataScope,
  checkActionAccess("delete"),
  deleteOrganisation,
);

export default router;
