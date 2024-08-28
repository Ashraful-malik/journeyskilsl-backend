import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema(
  {
    type: string,
  },
  { timestamps: true }
);

export const Tag = mongoose.model("Tag", tagSchema);
