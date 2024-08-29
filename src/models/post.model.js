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
    viewCount: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
    },

    link: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
