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

import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: All literal/static sub-paths MUST come before "/:id" routes.
// Order matters in Express — if /:id is registered first, "bulk" and "meta"
// will be treated as MongoDB IDs and cause 500 errors.
// ─────────────────────────────────────────────────────────────────────────────

// ── Meta ──────────────────────────────────────────────────────────────────────
router.get("/meta/districts",            getDistrictsByState);           // GET /organisations/meta/districts?state=X
router.get("/volunteers/meta/districts", getVolunteerDistrictsByState);  // GET /organisations/volunteers/meta/districts?state=X

// ── Volunteers ────────────────────────────────────────────────────────────────
router.post  ("/volunteers/bulk", restrictTo("admin"), bulkCreateVolunteers);
router.route ("/volunteers")
  .get  (getAllVolunteers)
  .post (restrictTo("admin"), createVolunteer);
router.route ("/volunteers/:id")
  .get    (getVolunteerById)
  .put    (restrictTo("admin"), updateVolunteer)
  .delete (restrictTo("admin"), deleteVolunteer);

// ── Organisations ─────────────────────────────────────────────────────────────
// /bulk MUST be before /:id — otherwise Express matches "bulk" as an _id param
router.post  ("/bulk", restrictTo("admin"), bulkCreateOrganisations);
router.route ("/")
  .get  (getAllOrganisations)
  .post (restrictTo("admin"), createOrganisation);
router.route ("/:id")
  .get    (getOrganisationById)
  .put    (restrictTo("admin"), updateOrganisation)
  .delete (restrictTo("admin"), deleteOrganisation);

export default router;