// models/volunteer.model.js — Updated with district field
import mongoose from "mongoose";
import validator from "validator";

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Volunteer name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    volunteer_type: {
      type: String,
      default: "Individual Volunteer",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(v),
        message: "Please provide a valid phone number",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    website: {
      type: String,
      trim: true,
      default: "NA",
      validate: {
        validator: (v) => !v || v === "NA" || /^https?:\/\/.+/.test(v),
        message: "Website must start with http:// or https://",
      },
    },
    address: {
      type: String,
      trim: true,
      default: null,
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
    area_of_interest: {
      type: String,
      required: [true, "Area of interest is required"],
      enum: {
        values: ["Teaching", "Tech", "Social Work", "Healthcare", "Environment", "Other"],
        message: "Invalid area of interest",
      },
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, "Remarks cannot exceed 500 characters"],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Not Active"],
        message: "Status must be Active or Not Active",
      },
      default: "Active",
    },
    follow_up_date: {
      type: Date,
      default: null,
    },
    registered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, collection: "volunteers" }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
volunteerSchema.index({ name: "text", city: "text", district: "text" });
volunteerSchema.index({ area_of_interest: 1 });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ state: 1 });
volunteerSchema.index({ district: 1 });                         // NEW
volunteerSchema.index({ createdAt: -1 });
volunteerSchema.index({ state: 1, status: 1, createdAt: -1 });
volunteerSchema.index({ district: 1, status: 1, createdAt: -1 }); // NEW
volunteerSchema.index({ area_of_interest: 1, status: 1, createdAt: -1 });

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;