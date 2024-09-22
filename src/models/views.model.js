import mongoose, { Schema } from "mongoose";

const viewSchema = new Schema(
  {
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "onModel", // Refer to either Post or Challenge
    },

    onModel: {
      type: String,
      enum: ["Post", "Challenge"],
      required: true,
    },

    viewedAt: {
      type: Date,
      default: Date.now,
      expires: "24h", // Automatically delete view record after 24 hours
    },
  },
  { timestamps: true }
);
viewSchema.index({ viewer: 1, target: 1, onModel: 1 }, { unique: true });
export const View = mongoose.model("View", viewSchema);
