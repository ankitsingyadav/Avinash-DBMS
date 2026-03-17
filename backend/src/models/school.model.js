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
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
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
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [10, "Please enter a complete address"],
    },
    principal_name: {
      type: String,
      required: [true, "Principal name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    established_year: {
      type: Number,
      required: [true, "Established year is required"],
      min: [1800, "Year must be after 1800"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
    },
    board_affiliation: {
      type: String,
      required: [true, "Board affiliation is required"],
      enum: {
        values: ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"],
        message: "Invalid board affiliation",
      },
    },
    total_students: {
      type: Number,
      min: [0, "Cannot be negative"],
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: "Website must start with http:// or https://",
      },
    },
    registered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "schools", // explicit collection name
  }
);

schoolSchema.index({ name: "text" });
schoolSchema.index({ board_affiliation: 1 });

const School = mongoose.model("School", schoolSchema);
export default School;