// organisation.routes.js
import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  createSchool, getAllSchools, getSchoolById, updateSchool, deleteSchool,
  createCollege, getAllColleges, getCollegeById, updateCollege, deleteCollege,
  createNGO, getAllNGOs, getNGOById, updateNGO, deleteNGO,
  createVolunteer, getAllVolunteers, getVolunteerById, updateVolunteer, deleteVolunteer,
} from "../controllers/organisation.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── SCHOOLS ──────────────────────────────────────────────────────────────────
router.route("/schools")
  .get(getAllSchools)                         // any authenticated user
  .post(restrictTo("admin"), createSchool);  // admin only

router.route("/schools/:id")
  .get(getSchoolById)
  .put(restrictTo("admin"), updateSchool)
  .delete(restrictTo("admin"), deleteSchool);

// ── COLLEGES ─────────────────────────────────────────────────────────────────
router.route("/colleges")
  .get(getAllColleges)
  .post(restrictTo("admin"), createCollege);

router.route("/colleges/:id")
  .get(getCollegeById)
  .put(restrictTo("admin"), updateCollege)
  .delete(restrictTo("admin"), deleteCollege);

// ── NGOs ─────────────────────────────────────────────────────────────────────
router.route("/ngos")
  .get(getAllNGOs)
  .post(restrictTo("admin"), createNGO);

router.route("/ngos/:id")
  .get(getNGOById)
  .put(restrictTo("admin"), updateNGO)
  .delete(restrictTo("admin"), deleteNGO);

// ── VOLUNTEERS ───────────────────────────────────────────────────────────────
router.route("/volunteers")
  .get(getAllVolunteers)
  .post(restrictTo("admin"), createVolunteer);

router.route("/volunteers/:id")
  .get(getVolunteerById)
  .put(restrictTo("admin"), updateVolunteer)
  .delete(restrictTo("admin"), deleteVolunteer);

export default router;