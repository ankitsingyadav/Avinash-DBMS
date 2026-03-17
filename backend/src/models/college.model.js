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
    director_name: {
      type: String,
      required: [true, "Director name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    established_year: {
      type: Number,
      required: [true, "Established year is required"],
      min: [1800, "Year must be after 1800"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
    },
    affiliation_university: {
      type: String,
      required: [true, "Affiliated university is required"],
      trim: true,
    },
    college_type: {
      type: String,
      required: [true, "College type is required"],
      enum: {
        values: ["Government", "Private", "Autonomous", "Deemed University", "Other"],
        message: "Invalid college type",
      },
    },
    total_departments: {
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
    collection: "colleges", // explicit collection name
  }
);

collegeSchema.index({ name: "text" });
collegeSchema.index({ college_type: 1 });
collegeSchema.index({ affiliation_university: 1 });

const College = mongoose.model("College", collegeSchema);
export default College;