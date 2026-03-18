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
    focus_area: {
      type: String,
      required: [true, "Focus area is required"],
      enum: {
        values: [
          "Education",
          "Healthcare",
          "Environment",
          "Women Empowerment",
          "Child Welfare",
          "Rural Development",
          "Disability Support",
          "Disaster Relief",
          "Animal Welfare",
          "Other",
        ],
        message: "Invalid focus area",
      },
    },
    head_name: {
      type: String,
      required: [true, "Head / Director name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    registration_number: {
      type: String,
      required: [true, "NGO registration number is required"],
      unique: true,
      trim: true,
    },
    established_year: {
      type: Number,
      required: [true, "Established year is required"],
      min: [1800, "Year must be after 1800"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
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
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null,
    },
    registered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "ngos", // explicit collection name
  }
);

ngoSchema.index({ name: "text" });
ngoSchema.index({ focus_area: 1 });

const NGO = mongoose.model("NGO", ngoSchema);
export default NGO;