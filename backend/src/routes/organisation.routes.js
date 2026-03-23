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
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
} from "../controllers/unifiedOrganisation.controller.js";

import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

// All organisation routes require authentication
router.use(protect);

// ── Volunteers ─────────────────────────────────────────────────────────────────
router.post("/volunteers/bulk", restrictTo("admin"), bulkCreateVolunteers);
router.route("/volunteers")
  .get(getAllVolunteers)
  .post(restrictTo("admin"), createVolunteer);
router.route("/volunteers/:id")
  .get(getVolunteerById)
  .put(restrictTo("admin"), updateVolunteer)
  .delete(restrictTo("admin"), deleteVolunteer);

// ── Unified Organisations ──────────────────────────────────────────────────────
router.route("/")
  .get(getAllOrganisations)
  .post(restrictTo("admin"), createOrganisation);

router.route("/:id")
  .get(getOrganisationById)
  .put(restrictTo("admin"), updateOrganisation)
  .delete(restrictTo("admin"), deleteOrganisation);

export default router;