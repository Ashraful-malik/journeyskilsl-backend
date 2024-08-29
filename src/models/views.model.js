import mongoose, { Schema } from "mongoose";

const viewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    itemType: {
      type: String,
      enum: ["Post", "Challenge"],
      required: true,
    },

    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const View = mongoose.model("View", viewSchema);
