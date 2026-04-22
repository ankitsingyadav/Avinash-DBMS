// ─── admin/constants.js ───────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Jammu and Kashmir", "Ladakh", "Puducherry",
];

const CENTRE_TYPES       = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
const INTERACTION_MODES  = ["Email", "Phone", "WhatsApp", "Visit"];

// ── Data completion status (replaces Active/Inactive for organisations) ────────
export const DATA_STATUS_OPTIONS = ["Basic", "Partial", "Complete"];

// ── Volunteer status (kept separate) ─────────────────────────────────────────
export const VOLUNTEER_STATUS_OPTIONS = ["Active", "Not Active"];

export const CATEGORIES = [
  // ── Volunteers ─────────────────────────────────────────────────────────────
  {
    id: "volunteer",
    label: "Volunteers",
    accent: "#f59e0b",
    endpoint: "/organisations/volunteers",
    dataKey: "volunteers",
    columns: [
      { key: "_id",             label: "ID",         mono: true,   w: 90 },
      { key: "name",            label: "Name",       sortable: true, bold: true, w: 180 },
      { key: "phone",           label: "Phone",                    w: 130 },
      { key: "email",           label: "Email",                    w: 190 },
      { key: "city",            label: "City",       sortable: true, w: 100 },
      { key: "district",        label: "District",   sortable: true, w: 120 },
      { key: "state",           label: "State",      sortable: true, w: 120 },
      { key: "area_of_interest",label: "Interest",   badge: true,   w: 130 },
      { key: "status",          label: "Status",     isStatus: true, w: 90 },
      { key: "follow_up_date",  label: "Follow-up",  isDate: true, sortable: true, w: 100 },
      { key: "createdAt",       label: "Added",      isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      {
        key: "area_of_interest",
        label: "Interest",
        options: ["Teaching", "Tech", "Social Work", "Healthcare", "Environment", "Other"],
      },
      {
        key: "status",
        label: "Status",
        options: VOLUNTEER_STATUS_OPTIONS,
      },
      { key: "state",    label: "State",    options: INDIAN_STATES, cascadesTo: "district" },
      {
        key: "district", label: "District", options: [],
        dependsOn: "state", async: true,
        metaEndpoint: "/organisations/volunteers/meta/districts",
      },
    ],
    fields: [
      "name", "phone", "email", "website", "address",
      "city", "district", "state", "area_of_interest",
      "remarks", "status", "follow_up_date",
    ],
    requiredFields: ["name", "phone", "email", "city", "district", "state", "area_of_interest"],
    fieldMap: {
      name: "name",
      "volunteer name": "name",
      phone: "phone",
      "contact number": "phone",
      email: "email",
      website: "website",
      address: "address",
      city: "city",
      district: "district",
      state: "state",
      interest: "area_of_interest",
      "area of interest": "area_of_interest",
      area_of_interest: "area_of_interest",
      remarks: "remarks",
      status: "status",
      "follow up date": "follow_up_date",
      "follow-up date": "follow_up_date",
      follow_up_date: "follow_up_date",
      id: "_id",
      _id: "_id",
    },
    signatureFields: ["area_of_interest"],
    editFields: [
      { key: "name",            label: "Volunteer Name", type: "text",   required: true },
      { key: "phone",           label: "Phone",          type: "tel",    required: true },
      { key: "email",           label: "Email",          type: "email",  required: true },
      { key: "website",         label: "Website",        type: "text" },
      { key: "address",         label: "Address",        type: "textarea" },
      { key: "city",            label: "City",           type: "text",   required: true },
      { key: "district",        label: "District",       type: "text",   required: true },
      { key: "state",           label: "State",          type: "select", options: INDIAN_STATES, required: true },
      {
        key: "area_of_interest", label: "Area of Interest", type: "select",
        options: ["Teaching", "Tech", "Social Work", "Healthcare", "Environment", "Other"],
        required: true,
      },
      { key: "status",          label: "Status",         type: "select", options: VOLUNTEER_STATUS_OPTIONS },
      { key: "follow_up_date",  label: "Follow-up Date", type: "date" },
      { key: "remarks",         label: "Remarks",        type: "textarea" },
    ],
  },

  // ── Organisations (Centres) ────────────────────────────────────────────────
  {
    id: "organisation",
    label: "Centres",
    accent: "#8b5cf6",
    endpoint: "/organisations",
    dataKey: "organisations",
    columns: [
      { key: "_id",        label: "ID",           mono: true,    w: 90 },
      { key: "centreName", label: "Centre Name",  sortable: true, bold: true, w: 190 },
      // Interaction col is injected by DataTable right after name — no entry needed here
      { key: "centreType", label: "Type",         badge: true,   w: 120 },
      { key: "city",       label: "City",         sortable: true, w: 100 },
      { key: "district",   label: "District",     sortable: true, w: 120 },
      { key: "state",      label: "State",        sortable: true, w: 120 },
      { key: "pincode",    label: "Pincode",                      w: 90 },
      { key: "onboardedBy",label: "Onboarded By",                w: 140 },
      // "phone" is inside contacts[0] but surfaced by the server virtual / populate.
      // Add it here so the column toggle knows about it. Backend should send
      // a top-level `phone` field or you can derive it in the frontend.
      { key: "status",     label: "Data",         isDataStatus: true, w: 100 },
      { key: "createdAt",  label: "Added",        isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      { key: "centreType", label: "Type",   options: CENTRE_TYPES },
      {
        key: "status",     label: "Data",
        options: DATA_STATUS_OPTIONS,
      },
      { key: "state",    label: "State",    options: INDIAN_STATES, cascadesTo: "district" },
      {
        key: "district", label: "District", options: [],
        dependsOn: "state", async: true,
        metaEndpoint: "/organisations/meta/districts",
      },
    ],
    fields: [
      "centreName", "centreType", "website", "address",
      "city", "district", "state", "pincode",
      "onboardedBy", "ninAin", "contacts",
      "interaction.interactionBy", "interaction.interactedWith",
      "interaction.interactionDate", "interaction.interactionMode",
      "interaction.notes", "interaction.ninAin", "interaction.nextInteractionDate",
      "status",
    ],
    requiredFields: [
      "centreName", "centreType", "address", "city", "district",
      "state", "pincode", "onboardedBy", "contacts",
    ],
    fieldMap: {
      centrename:         "centreName",
      name:               "centreName",
      "centre name":      "centreName",
      centretype:         "centreType",
      type:               "centreType",
      "centre type":      "centreType",
      website:            "website",
      address:            "address",
      city:               "city",
      district:           "district",
      state:              "state",
      pincode:            "pincode",
      onboardedby:        "onboardedBy",
      "onboarded by":     "onboardedBy",
      "nin ain":          "ninAin",
      "nin/ain":          "ninAin",
      ninain:             "ninAin",
      phone:              "phone",
      contact:            "phone",
      "contact number":   "phone",
      mobile:             "phone",
      "mobile number":    "phone",
      email:              "email",
      "email address":    "email",
      status:             "status",
      data:               "status",
      id:                 "_id",
      _id:                "_id",
    },
    signatureFields: ["centreType", "onboardedBy"],
    editFields: [
      // ── Basic Info ──
      { key: "centreName",  label: "Centre Name",  type: "text",   required: true },
      { key: "centreType",  label: "Centre Type",  type: "select", options: CENTRE_TYPES, required: true },
      { key: "website",     label: "Website",      type: "text" },

      // ── Location ──
      { key: "state",       label: "State",        type: "select", options: INDIAN_STATES, required: true },
      { key: "district",    label: "District",     type: "text",   required: true },
      { key: "city",        label: "City",         type: "text",   required: true },
      { key: "pincode",     label: "Pincode",      type: "text",   required: true },
      { key: "address",     label: "Address",      type: "textarea", required: true },

      // ── Contacts ──
      { key: "contacts", label: "Contact Persons", type: "contacts" },

      // ── Interaction Remarks ──
      { key: "interaction.interactionBy",      label: "Interaction By",       type: "text",   required: true },
      { key: "interaction.interactedWith",     label: "Interacted With",      type: "text",   required: true },
      { key: "interaction.interactionDate",    label: "Interaction Date",     type: "date",   required: true },
      { key: "interaction.interactionMode",    label: "Interaction Mode",     type: "select", options: INTERACTION_MODES, required: true },
      { key: "interaction.notes",              label: "Notes",                type: "textarea" },
      { key: "interaction.ninAin",             label: "Interaction NIN / AIN", type: "text",  required: true },
      { key: "interaction.nextInteractionDate",label: "Next Interaction Date", type: "date" },

      // ── Onboarding ──
      { key: "onboardedBy", label: "Onboarded By", type: "text",   required: true },
      { key: "ninAin",      label: "NIN / AIN",    type: "text",   required: true },
      {
        key: "status",
        label: "Data Completion",
        type: "select",
        options: DATA_STATUS_OPTIONS,
      },
    ],
  },
];

// Derived maps used by ImportModal
export const ALL_FIELD_MAPS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.fieldMap])
);
export const CAT_SIGNATURE = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.signatureFields])
);

// Import batch size
export const IMPORT_BATCH_SIZE = 50;