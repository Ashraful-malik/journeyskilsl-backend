import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema(
  {
    challengeOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    challengeName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    progress: [
      {
        type: Schema.Types.ObjectId,
        ref: "Progress",
      },
    ],
    hashtag: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    days: {
      type: Number,
      required: true,
    },

    isPublic: {
      type: boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Challenge = mongoose.model("Challenge", challengeSchema);
