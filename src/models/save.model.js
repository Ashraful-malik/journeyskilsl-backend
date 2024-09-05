import mongoose, { Schema } from "mongoose";

const saveSchema = new Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Save = mongoose.model("Save", saveSchema);
