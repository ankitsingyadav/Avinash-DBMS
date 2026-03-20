// models/school.model.js
import mongoose from "mongoose";
import validator from "validator";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    school_type: {
      type: String,
      required: [true, "School type is required"],
      enum: {
        values: ["Government", "Private"],
        message: "School type must be Government or Private",
      },
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
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Please enter a complete address"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    principal_name: {
      type: String,
      required: [true, "Principal name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
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
        values: ["Active", "Inactive"],
        message: "Status must be Active or Inactive",
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
  { timestamps: true, collection: "schools" }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Full-text search across name, city, and principal name
schoolSchema.index({ name: "text", city: "text", principal_name: "text" });

// Individual field indexes for single-filter queries
schoolSchema.index({ school_type: 1 });
schoolSchema.index({ status: 1 });
schoolSchema.index({ state: 1 });
schoolSchema.index({ createdAt: -1 });

// Composite index for combined filter + sort queries (most common pattern)
schoolSchema.index({ state: 1, status: 1, createdAt: -1 });
schoolSchema.index({ school_type: 1, status: 1, createdAt: -1 });

const School = mongoose.model("School", schoolSchema);
export default School;