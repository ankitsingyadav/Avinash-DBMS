// routes/organisation.routes.js
import express from "express";
import {
  // Schools
  createSchool,
  bulkCreateSchools,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  // Colleges
  createCollege,
  bulkCreateColleges,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  // NGOs
  createNGO,
  bulkCreateNGOs,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO,
  // Volunteers
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

// ── Specific Organisation Types ────────────────────────────────────────────────
// These specific routes must come BEFORE the generic /:id route

// ── Schools ────────────────────────────────────────────────────────────────────
router.post(   "/schools/bulk", restrictTo("admin"), bulkCreateSchools);
router.route(  "/schools")
  .get(                         getAllSchools)
  .post(        restrictTo("admin"), createSchool);
router.route(  "/schools/:id")
  .get(                         getSchoolById)
  .put(         restrictTo("admin"), updateSchool)
  .delete(      restrictTo("admin"), deleteSchool);

// ── Colleges ───────────────────────────────────────────────────────────────────
router.post(   "/colleges/bulk", restrictTo("admin"), bulkCreateColleges);
router.route(  "/colleges")
  .get(                          getAllColleges)
  .post(        restrictTo("admin"), createCollege);
router.route(  "/colleges/:id")
  .get(                          getCollegeById)
  .put(         restrictTo("admin"), updateCollege)
  .delete(      restrictTo("admin"), deleteCollege);

// ── NGOs ───────────────────────────────────────────────────────────────────────
router.post(   "/ngos/bulk", restrictTo("admin"), bulkCreateNGOs);
router.route(  "/ngos")
  .get(                      getAllNGOs)
  .post(        restrictTo("admin"), createNGO);
router.route(  "/ngos/:id")
  .get(                      getNGOById)
  .put(         restrictTo("admin"), updateNGO)
  .delete(      restrictTo("admin"), deleteNGO);

// ── Volunteers ─────────────────────────────────────────────────────────────────
router.post(   "/volunteers/bulk", restrictTo("admin"), bulkCreateVolunteers);
router.route(  "/volunteers")
  .get(                            getAllVolunteers)
  .post(        restrictTo("admin"), createVolunteer);
router.route(  "/volunteers/:id")
  .get(                            getVolunteerById)
  .put(         restrictTo("admin"), updateVolunteer)
  .delete(      restrictTo("admin"), deleteVolunteer);

// ── Unified Organisations (Generic) ───────────────────────────────────────────
// Generic routes should be at the end
router.route("/")
  .get(getAllOrganisations)
  .post(restrictTo("admin"), createOrganisation);

router.route("/:id")
  .get(getOrganisationById)
  .put(restrictTo("admin"), updateOrganisation)
  .delete(restrictTo("admin"), deleteOrganisation);

export default router;
