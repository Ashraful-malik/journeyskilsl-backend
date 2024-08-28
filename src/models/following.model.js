import mongoose, { Schema } from "mongoose";

const followingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensuring that a user cannot follow the same person more than once
followingSchema.index({ userId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model("Following", followingSchema);
