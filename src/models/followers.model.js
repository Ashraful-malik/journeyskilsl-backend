import mongoose, { Schema } from "mongoose";

const followersSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followerId: {
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
  { timestamps: true }
);

// Ensuring that the same person cannot follow a user more than once
followersSchema.index({ userId: 1, followerId: 1 }, { unique: true });

export const Followers = mongoose.model("Followers", followersSchema);
