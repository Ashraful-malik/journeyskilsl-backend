import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    commentBy: {
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
      enum: ["Challenge", "Post"],
      required: true,
    },

    content: {
      type: String,
      required: true, // Ensure the comment has content
    },
  },

  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
