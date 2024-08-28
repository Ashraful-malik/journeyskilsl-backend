import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    itemType: {
      type: String,
      enum: ["Post", "Challenge"],
      required: true,
    },

    liked_at: {
      type: Date,
      default: Date.now,
    },
  },

  { timestamps: true }
);

likeSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

export const Like = mongoose.model("like", likeSchema);
