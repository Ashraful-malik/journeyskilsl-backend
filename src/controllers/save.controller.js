import { Post } from "../models/post.model.js";
import { Save } from "../models/save.model";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Challenge } from "../models/challenge.model.js";

const savePostAndChallenge = asyncHandler(async (req, res) => {
  const { postId, challengeId } = req.body;
  const userId = req.user._id;

  if (!postId && !challengeId) {
    throw new ApiError(400, "postId or challengeId is required");
  }

  if (postId) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "post not found");
    }

    const save = await Save.findOne({ posts: postId, user: userId });

    if (save) {
      throw new ApiError(400, "post already saved");
    }
    const newSave = new Save({ posts: postId, user: userId });
    await newSave.save();

    res.status(200).json({
      status: "success",
      message: "post saved successfully",
    });

    // save challenge
  } else if (challengeId) {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new ApiError(404, "challenge not found");
    }

    const save = await Save.findOne({ challenges: challengeId, user: userId });

    if (save) {
      throw new ApiError(400, "challenge already saved");
    }

    const newSave = new Save({ challenges: challengeId, user: userId });
    await newSave.save();

    return res
      .status(200)
      .json(new ApiResponse(200, newSave, "challenge saved successfully"));
  }
});

const unsavePostAndChallenge = asyncHandler(async (req, res) => {
  const { postId, challengeId } = req.body;
  const userId = req.user._id;
  const savedItems = await Save.findById({ user: userId });

  if (!savedItems) {
    throw new ApiError(404, "no save item found");
  }
  if (postId) {
    Save.posts = savedItems.posts.filter((id) => id.toString() !== postId);
  }
  if (challengeId) {
    Save.challenges = savedItems.challenges.filter(
      (id) => id.toString() !== challengeId
    );
    await savedItems.save();

    return res
      .status(200)
      .json(new ApiResponse(200, savedItems, "item unsaved successfully"));
  }
});

const getSavedItems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const savedItems = await Save.find({ user: userId })
      .populate("posts")
      .populate("challenges")
      .skip(skip);

    if (!savedItems) {
      return res.status(404).json({ message: "No saved items found" });
    }

    return res.status(200).json(new ApiResponse(200, savedItems, "success"));
  } catch (error) {
    throw new ApiError(400, error, "error in getting saved items");
  }
});

export { savePostAndChallenge, unsavePostAndChallenge, getSavedItems };
