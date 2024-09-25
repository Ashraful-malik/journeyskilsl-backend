import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    commentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: { type: Schema.Types.ObjectId, ref: "Post" },

    challenge: { type: Schema.Types.ObjectId, ref: "Challenge" },

    content: {
      type: String,
      required: true, // Ensure the comment has content
    },
  },

  { timestamps: true }
);

// Pre-save hook to update `updatedAt` on comment update
commentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Comment = mongoose.model("Comment", commentSchema);
