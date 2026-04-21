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

import {
  createOrganisation,
  bulkCreateOrganisations,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  getDistrictsByState,
  getVolunteerDistrictsByState,
  addInteraction,
  getInteractions,
} from "../controllers/unifiedOrganisation.controller.js";

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

// protect is already applied globally here — no need to repeat it on individual routes
router.use(protect);

// ── Meta endpoints ────────────────────────────────────────────────────────────
router.get("/meta/districts",            requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"), getDistrictsByState);
router.get("/volunteers/meta/districts", requireRole("full_admin", "admin", "partial_admin", "data_entry", "user"), getVolunteerDistrictsByState);

// ── Volunteer routes ──────────────────────────────────────────────────────────
router.get(    "/volunteers",      checkModuleAccess("volunteer"), applyDataScope, applyDateRangeScope, checkActionAccess("view"),   getAllVolunteers);
router.get(    "/volunteers/:id",  checkModuleAccess("volunteer"), applyDataScope, applyDateRangeScope, checkActionAccess("view"),   getVolunteerById);
router.post(   "/volunteers",      checkModuleAccess("volunteer"), applyDataScope, checkActionAccess("add"),                         createVolunteer);
router.post(   "/volunteers/bulk", requireRole("full_admin", "admin"),                                                               bulkCreateVolunteers);
router.put(    "/volunteers/:id",  checkModuleAccess("volunteer"), applyDataScope, checkActionAccess("edit"),                        updateVolunteer);
router.delete( "/volunteers/:id",  checkModuleAccess("volunteer"), applyDataScope, checkActionAccess("delete"),                      deleteVolunteer);

// ── IMPORTANT: Static routes MUST come before /:id to avoid Express
//    treating "upcoming-interactions" as an :id param ─────────────────────────

// Notification bell — upcoming interactions in next 48h
router.get("/upcoming-interactions", getUpcomingInteractions);

// Interaction sub-routes (static path with :id, placed before plain /:id)
router.get(  "/:id/interactions",        checkModuleAccess("organisation"), applyDataScope, checkActionAccess("view"), getInteractions);
router.post( "/:id/interactions",        checkModuleAccess("organisation"), applyDataScope, checkActionAccess("edit"), addInteraction);
router.post( "/:id/interactions/cancel", checkModuleAccess("organisation"), applyDataScope, checkActionAccess("edit"), cancelNextInteraction);

// ── Organisation CRUD ─────────────────────────────────────────────────────────
// These use /:id so they MUST come after all static routes above
router.get(    "/",      checkModuleAccess("organisation"), applyDataScope, applyDateRangeScope, checkActionAccess("view"),   getAllOrganisations);
router.get(    "/:id",   checkModuleAccess("organisation"), applyDataScope, applyDateRangeScope, checkActionAccess("view"),   getOrganisationById);
router.post(   "/",      checkModuleAccess("organisation"), applyDataScope, checkActionAccess("add"),                         createOrganisation);
router.post(   "/bulk",  requireRole("full_admin", "admin"),                                                                   bulkCreateOrganisations);
router.put(    "/:id",   checkModuleAccess("organisation"), applyDataScope, checkActionAccess("edit"),                        updateOrganisation);
router.delete( "/:id",   checkModuleAccess("organisation"), applyDataScope, checkActionAccess("delete"),                      deleteOrganisation);

export default router;