// models/organisation.model.js — Updated with district field
import mongoose from "mongoose";
import validator from "validator";

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
      validator: (v) => /^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(v),
      message: "Please provide a valid contact number",
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
});

const organisationSchema = new mongoose.Schema(
  {
    centreType: {
      type: String,
      required: [true, "Centre type is required"],
      enum: {
        values: ["School", "College", "NGO", "Corporate", "Online", "Community Centre"],
        message: "Invalid centre type",
      },
    },
    centreName: {
      type: String,
      required: [true, "Centre name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: "Website must start with http:// or https://",
      },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    // ── NEW: district field ──────────────────────────────────────────────────
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
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
    contacts: {
      type: [contactSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one contact person is required",
      },
    },
    onboardedBy: {
      type: String,
      required: [true, "Onboarded by is required"],
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

// ── Indexes ────────────────────────────────────────────────────────────────────
organisationSchema.index({ centreName: "text", city: "text", district: "text" });
organisationSchema.index({ centreType: 1 });
organisationSchema.index({ state: 1 });
organisationSchema.index({ district: 1 });                            // NEW
organisationSchema.index({ pincode: 1 });
organisationSchema.index({ state: 1, district: 1, centreType: 1 }); // NEW compound

const Organisation = mongoose.model("Organisation", organisationSchema);
export default Organisation;