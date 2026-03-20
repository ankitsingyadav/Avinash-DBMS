// models/ngo.model.js
import mongoose from "mongoose";
import validator from "validator";

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "NGO name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    ngo_type: {
      type: String,
      required: [true, "NGO type is required"],
      enum: {
        values: ["Trust", "Society", "Foundation"],
        message: "NGO type must be Trust, Society, or Foundation",
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
    coordinator_name: {
      type: String,
      required: [true, "Coordinator name is required"],
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
  { timestamps: true, collection: "ngos" }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
ngoSchema.index({ name: "text", city: "text", coordinator_name: "text" });
ngoSchema.index({ ngo_type: 1 });
ngoSchema.index({ status: 1 });
ngoSchema.index({ state: 1 });
ngoSchema.index({ createdAt: -1 });
ngoSchema.index({ state: 1, status: 1, createdAt: -1 });
ngoSchema.index({ ngo_type: 1, status: 1, createdAt: -1 });

const NGO = mongoose.model("NGO", ngoSchema);
export default NGO;