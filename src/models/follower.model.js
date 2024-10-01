import mongoose, { Schema } from "mongoose";

const followersSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    follower: {
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
followerSchema.index({ user: 1, follower: 1 }, { unique: true });

export const Follower = mongoose.model("Follower", followersSchema);
