import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  verificationCode: { type: Number, index: 1 },
  verificationExpires: { type: Date },

  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "15m" }, // Set the TTL index to 15 minutes
  },
});
VerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });
export const Verification = mongoose.model("Verification", VerificationSchema);
