import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
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
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(v);
        },
        message: "Please provide a valid phone number",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    // ── NIN / AIN Number (replaces teamName) ────────────────────────────────
    ninAinNumber: {
      type: String,
      required: [true, "NIN / AIN number is required"],
      trim: true,
      minlength: [2, "NIN / AIN number must be at least 2 characters"],
      maxlength: [50, "NIN / AIN number cannot exceed 50 characters"],
    },

    // ── Roles: user | admin (legacy) | full_admin | partial_admin | data_entry
    role: {
      type: String,
      enum: ["user", "admin", "full_admin", "partial_admin", "data_entry"],
      default: "user",
    },

    // ── Access Control Permissions ──────────────────────────────────────────
    permissions: {
      // Modules the user can access: "volunteer" | "organisation"
      // For partial_admin, can also scope to centreTypes: "School","NGO" etc.
      allowedModules: {
        type: [String],
        default: [],
      },
      // CRUD actions allowed: view | add | edit | delete
      allowedActions: {
        type: [String],
        enum: ["view", "add", "edit", "delete"],
        default: [],
      },
      // Fields hidden from responses: "phone" | "email"
      hiddenFields: {
        type: [String],
        default: [],
      },
      // Date-range restriction — user only sees records created in this window
      dateFrom: {
        type: Date,
        default: null,
      },
      dateTo: {
        type: Date,
        default: null,
      },
      // Access to notification bell and /notifications page
      notificationAccess: {
        type: Boolean,
        default: false,
      },
    },

    profileImage: {
      public_id: { type: String, default: null },
      url:       { type: String, default: null },
    },

    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true  },

    // Password reset
    passwordResetToken:   String,
    passwordResetExpires: Date,

    lastLogin: { type: Date, default: null },

    refreshToken: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// ─── Pre-save: Hash password ─────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

// True for "admin" (legacy) and "full_admin"
userSchema.methods.isFullAdmin = function () {
  return this.role === "full_admin" || this.role === "admin";
};

userSchema.methods.canAccessModule = function (module) {
  if (this.isFullAdmin()) return true;
  return (this.permissions?.allowedModules ?? []).includes(module);
};

userSchema.methods.canPerformAction = function (action) {
  if (this.isFullAdmin()) return true;
  return (this.permissions?.allowedActions ?? []).includes(action);
};

// ─── Virtual: avatar ─────────────────────────────────────────────────────────
userSchema.virtual("avatar").get(function () {
  if (this.profileImage?.url) return this.profileImage.url;
  const initials = this.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=200`;
});

const User = mongoose.model("User", userSchema);
export default User;