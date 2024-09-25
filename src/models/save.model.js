import mongoose, { Schema } from "mongoose";

const saveSchema = new Schema(
  {
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    challenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
saveSchema.index({ user: 1, challenge: 1, post: 1 }, { unique: true });
export const Save = mongoose.model("Save", saveSchema);
