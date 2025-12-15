/**
 * User Model - Modern, always unique referralCode, default avatar, lowercased
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const walletSchema = new mongoose.Schema(
  {
    coin: { type: String, required: true, trim: true, uppercase: true },
    balance: { type: Number, default: 0, min: 0 },
    address: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const kycSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    documentUrl: { type: String, trim: true },
    backDocumentUrl: { type: String, trim: true },
    submittedAt: { type: Date },
    error: { type: String, trim: true },
  },
  { _id: false }
);

function makeReferralCode() {
  return (
    "AEX" +
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    Date.now().toString().slice(-4)
  );
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    avatar: { type: String, default: "" },
    referralCode: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    wallets: { type: [walletSchema], default: [] },
    balance: { type: Number, default: 0, min: 0 },
    kyc: { type: kycSchema, default: () => ({}) },
    confirmationCode: { type: String },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },

    // New: depositAddresses per user, per coin, per network.
    // Structure:
    // depositAddresses: {
    //   BTC: { Mainnet: "addr" },
    //   USDT: { ERC20: "0x...", TRC20: "T..." }
    // }
    depositAddresses: { type: Object, default: {} }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (!this.referralCode || this.referralCode === "") {
    this.referralCode = makeReferralCode();
  }
  if (!this.avatar) {
    this.avatar = "/assets/avatars/default.png";
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);