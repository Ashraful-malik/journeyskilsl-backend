import mongoose, { Schema } from "mongoose";

const TaskLogSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  completionDate: { type: Date, required: true },
});

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

    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    days: {
      type: Number,
      required: true, //45,90,days etc
    },

    tasksRequired: {
      type: Number,
      required: true,
    }, // How many posts are required to complete the

    tasksCompleted: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    consistencyIncentiveDays: {
      type: Number,
    },

    taskLogs: [TaskLogSchema],

    tasksRequired: {
      type: Number,
      required: true,
    },

    lastActivityDate: {
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
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
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

challengeSchema.index({ tags: 1 });
challengeSchema.index({ isPublic: 1 });

export const Challenge = mongoose.model("Challenge", challengeSchema);
