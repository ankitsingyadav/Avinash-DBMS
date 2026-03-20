// models/college.model.js
import mongoose from "mongoose";
import validator from "validator";

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    college_type: {
      type: String,
      required: [true, "College type is required"],
      enum: {
        values: ["University", "Private", "Government"],
        message: "Invalid college type",
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
    placement_officer: {
      type: String,
      required: [true, "Placement Officer / HOD name is required"],
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
  { timestamps: true, collection: "colleges" }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
collegeSchema.index({ name: "text", city: "text", placement_officer: "text" });
collegeSchema.index({ college_type: 1 });
collegeSchema.index({ status: 1 });
collegeSchema.index({ state: 1 });
collegeSchema.index({ createdAt: -1 });
collegeSchema.index({ state: 1, status: 1, createdAt: -1 });
collegeSchema.index({ college_type: 1, status: 1, createdAt: -1 });

const College = mongoose.model("College", collegeSchema);
export default College;