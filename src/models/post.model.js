import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
    },

    text: {
      type: String,
    },

    image: {
      type: String, //cloudinary url
    },

    imagePublicId: {
      type: String, //cloudinary public id
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    link: {
      type: String,
    },
  },
  { timestamps: true }
);

postSchema.index({ challengeId: 1 });

export const Post = mongoose.model("Post", postSchema);
