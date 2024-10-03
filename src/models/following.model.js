import mongoose, { Schema } from "mongoose";

const followingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensuring that a user cannot follow the same person more than once
followingSchema.index({ user: 1, following: 1 }, { unique: true });

export const Following = mongoose.model("Following", followingSchema);
