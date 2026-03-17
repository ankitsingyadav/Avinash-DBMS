// models/volunteer.model.js

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
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Please provide at least one skill",
      },
    },
    availability: {
      type: String,
      required: [true, "Availability is required"],
      enum: {
        values: ["Full-time", "Part-time", "Weekends Only", "Flexible"],
        message: "Invalid availability option",
      },
    },
    experience_years: {
      type: Number,
      min: [0, "Cannot be negative"],
      max: [60, "Please enter a realistic value"],
      default: 0,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },

    // assigned_to — optional, sirf tab save hoga jab controller mein bheja jaye
    assigned_to: {
      type: {
        type: String,
        enum: {
          values: ["school", "college", "ngo"],
          message: "assigned_to.type must be school, college, or ngo",
        },
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "assigned_to.type",
      },
      _id: false,
    },

    registered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "volunteers",
  }
);

volunteerSchema.index({ name: "text" });
volunteerSchema.index({ skills: 1 });
volunteerSchema.index({ "assigned_to.type": 1, "assigned_to.id": 1 });

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;