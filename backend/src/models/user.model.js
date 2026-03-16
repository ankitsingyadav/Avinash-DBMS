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
          // Supports Indian and international formats
          return /^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(v);
        },
        message: "Please provide a valid phone number",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [13, "You must be at least 13 years old"],
      max: [120, "Please provide a valid age"],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profileImage: {
      public_id: {
        type: String,
        default: null,
      },
      url: {
        type: String,
        default: null,
      },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,

    // For tracking last login
    lastLogin: {
      type: Date,
      default: null,
    },

    // Refresh token for JWT rotation
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// email aur phone ke indexes unique:true se automatically ban jaate hain
// isliye yahan dobara likhne ki zaroorat nahi — warnings fix ho jayengi
userSchema.index({ role: 1 });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// ─── Pre-save: Hash password ─────────────────────────────────────────────────
// ─── Pre-save: Hash password ─────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
// ─── Instance Methods ────────────────────────────────────────────────────────

// Compare entered password with hashed
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token (stored as hash in DB)
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store hashed version in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Return raw token (sent via email)
  return resetToken;
};

// Virtual: profile image URL with fallback
userSchema.virtual("avatar").get(function () {
  if (this.profileImage?.url) return this.profileImage.url;
  // Initials-based avatar fallback
  const initials = this.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=200`;
});

const User = mongoose.model("User", userSchema);
export default User;