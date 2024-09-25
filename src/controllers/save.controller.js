import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Save } from "../models/save.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Challenge } from "../models/challenge.model.js";

const toggleSave = asyncHandler(async (req, res) => {
  const { postId, challengeId } = req.body;
  const userId = req.user?._id;

  if (!postId && !challengeId) {
    throw new ApiError(400, "postId or challengeId is required");
  }

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Handle saving post
    if (postId) {
      const [post, save] = await Promise.all([
        Post.findById(postId).session(session), // Run within the session
        Save.findOne({ posts: postId, user: userId }).session(session), // Run within the session
      ]);

      if (!post) {
        throw new ApiError(404, "Post not found");
      }

      if (save) {
        await Save.findOneAndDelete({ posts: postId, user: userId }).session(
          session
        );

        await session.commitTransaction();
        session.endSession();
        return res
          .status(200)
          .json(new ApiResponse(200, null, "Post unsaved successfully"));
      }

      // Create new save for the post
      const newSave = new Save({ posts: postId, user: userId });
      await newSave.save({ session });

      // Commit the transaction if everything is successful
      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, newSave, "Post saved successfully"));
    }

    // Handle saving challenge
    if (challengeId) {
      const [challenge, save] = await Promise.all([
        Challenge.findById(challengeId).session(session), // Run within the session
        Save.findOne({ challenges: challengeId, user: userId }).session(
          session
        ), // Run within the session
      ]);

      if (!challenge) {
        throw new ApiError(404, "Challenge not found");
      }

      if (save) {
        await Save.findOneAndDelete({
          challenges: challengeId,
          user: userId,
        }).session(session);
        // Commit the transaction and send a success response
        await session.commitTransaction();
        session.endSession();

        return res
          .status(200)
          .json(new ApiResponse(200, null, "Challenge unsaved successfully"));
      }

      // Create new save for the challenge
      const newSave = new Save({ challenges: challengeId, user: userId });
      await newSave.save({ session });

      // Commit the transaction if everything is successful
      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, newSave, "Challenge saved successfully"));
    }
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(400, error, "Error occurred during save");
  }
});

const getSavedItems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const savedItems = await Save.find({ user: userId })
      .populate({
        path: "posts",
        select: "_id text image link createdAt", // Only select the necessary fields for posts
      })
      .populate({
        path: "challenges",
        select: "_id challengeName description createdAt", // Only select the necessary fields for challenges
      });

    if (!savedItems) {
      return res.status(404).json({ message: "No saved items found" });
    }

    return res.status(200).json(new ApiResponse(200, savedItems, "success"));
  } catch (error) {
    throw new ApiError(400, error, "error in getting saved items");
  }
});

export { toggleSave, getSavedItems };
