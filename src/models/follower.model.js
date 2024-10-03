import mongoose, { Schema } from "mongoose";

const followerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // The user who is being followed

  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // The follower user
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure that a user cannot follow the same person multiple times
followerSchema.index({ user: 1, follower: 1 }, { unique: true });

export const Follower = mongoose.model("Follower", followerSchema);
