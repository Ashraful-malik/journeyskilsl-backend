import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema(
  {
    challengeOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
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
        ref: "Tag",
      },
    ],
    days: {
      type: Number,
      required: true,
    },

    isPublic: {
      type: Boolean,
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

challengeSchema.index({ hashtags: 1 });
challengeSchema.index({ isPublic: 1 });

export const Challenge = mongoose.model("Challenge", challengeSchema);
