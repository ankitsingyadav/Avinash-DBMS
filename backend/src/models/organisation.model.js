// models/organisation.model.js
import mongoose from "mongoose";

// ── Contact sub-schema ────────────────────────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Contact name is required"],
    trim: true,
  },
  designation: {
    type: String,
    required: [true, "Designation is required"],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true,
    validate: {
      validator: (v) => /^[+\d\s\-()]{7,20}$/.test(v),
      message: "Please provide a valid contact number",
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Please provide a valid email address",
    },
  },
});

// ── Interaction sub-schema ────────────────────────────────────────────────────
// Single interaction entry — used inside interactions[] array
const interactionSchema = new mongoose.Schema(
  {
    interactionBy: {
      type: String,
      required: [true, "Interaction by is required"],
      trim: true,
    },
    interactedWith: {
      type: String,
      required: [true, "Interacted with is required"],
      trim: true,
    },
    interactionDate: {
      type: Date,
      required: [true, "Interaction date is required"],
    },
    notes: {
      type: String,
      trim: true,
    },
    ninAin: {
      type: String,
      trim: true,
    },
    nextInteractionDate: {
      type: Date,
    },
    interactionMode: {
      type: String,
      required: [true, "Interaction mode is required"],
      enum: {
        values: ["Email", "Phone", "WhatsApp", "Visit"],
        message: "Invalid interaction mode: {VALUE}",
      },
    },
  },
  { timestamps: true } // createdAt helps sort history
);

// ── Main schema ───────────────────────────────────────────────────────────────
const organisationSchema = new mongoose.Schema(
  {
    centreType: {
      type: String,
      required: [true, "Centre type is required"],
      enum: {
        values: ["School", "College", "NGO", "Corporate", "Online", "Community Centre"],
        message: "Invalid centre type: {VALUE}",
      },
    },
    centreName: {
      type: String,
      required: [true, "Centre name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    website: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      validate: {
        validator: (v) => /^\d{6}$/.test(v),
        message: "Pincode must be a 6-digit number",
      },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    contacts: {
      type: [contactSchema],
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length > 0,
          message: "At least one contact person is required",
        },
        {
          validator: (v) => Array.isArray(v) && v.length <= 4,
          message: "Maximum 4 contact persons allowed",
        },
      ],
    },

    // ── interactions: full history array ─────────────────────────────────────
    // Latest entry = interactions[interactions.length - 1]
    // We also keep a top-level `interaction` virtual for backward compat with
    // existing code that reads record.interaction
    interactions: {
      type: [interactionSchema],
      default: [],
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length > 0,
          message: "At least one interaction entry is required",
        },
      ],
    },

    onboardedBy: {
      type: String,
      required: [true, "Onboarded by is required"],
      trim: true,
    },
    ninAin: {
      type: String,
      trim: true,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "organisations" }
);

// ── Virtual: latest interaction (backward compat) ─────────────────────────────
// Existing code that reads record.interaction still works — it gets the latest.
organisationSchema.virtual("interaction").get(function () {
  if (!this.interactions || this.interactions.length === 0) return null;
  return this.interactions[this.interactions.length - 1];
});

// Make virtuals show up in toObject() / toJSON() calls
organisationSchema.set("toObject", { virtuals: true });
organisationSchema.set("toJSON",   { virtuals: true });

// ── Shared normalise helper ───────────────────────────────────────────────────
function normaliseData(data) {
  if (!data) return;
  if (data.pincode) {
    data.pincode = String(data.pincode)
      .trim()
      .replace(/\.0+$/, "")
      .replace(/\D/g, "")
      .slice(0, 6);
  }
  if (data.website && !/^https?:\/\//i.test(data.website)) {
    data.website = `https://${data.website}`;
  }
}

organisationSchema.pre("save", async function () {
  normaliseData(this);
});

organisationSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  normaliseData(update?.$set || update);
});

organisationSchema.pre("updateOne", async function () {
  const update = this.getUpdate();
  normaliseData(update?.$set || update);
});

// ── Indexes ───────────────────────────────────────────────────────────────────
organisationSchema.index({ centreName: "text", city: "text", district: "text" });
organisationSchema.index({ centreType: 1 });
organisationSchema.index({ state: 1 });
organisationSchema.index({ district: 1 });
organisationSchema.index({ pincode: 1 });
organisationSchema.index({ state: 1, district: 1, centreType: 1 });
organisationSchema.index({ "interactions.interactionDate": 1 });
organisationSchema.index({ "interactions.nextInteractionDate": 1 });
organisationSchema.index({ ninAin: 1 }, { sparse: true });

const Organisation = mongoose.model("Organisation", organisationSchema);
export default Organisation;

