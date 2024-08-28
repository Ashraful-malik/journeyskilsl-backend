import mongoose, { Schema } from "mongoose";

const challengeProgressSchema = new Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },

    postCount: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Progress = mongoose.model("Progress", challengeProgressSchema);
