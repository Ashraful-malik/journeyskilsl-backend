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
    hashtags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Hashtag",
      },
    ],
    days: {
      type: Number,
      required: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
      set: (value) => {
        if (typeof value === "string") {
          return value.toLowerCase() === "true";
        }
        return Boolean(value);
      },
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

challengeSchema.index({ hashtags: 1 });

export const Challenge = mongoose.model("Challenge", challengeSchema);
