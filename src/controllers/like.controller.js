import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Post } from "../models/post.model.js";
import { Challenge } from "../models/challenge.model.js";
import { Like } from "../models/like.model.js";

// toggle like and unlike
const toggleLike = asyncHandler(async (req, res) => {
  const { targetId, targetType } = req.body;

  const userId = req.user?._id;

  if (!targetId || !targetType) {
    throw new ApiError(400, "targetId and targetType are required");
  }

  const Model = targetType === "Post" ? Post : Challenge;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingLike = await Like.findOne({ userId, targetId, targetType });
    console.log("existingLike===>", existingLike);
    //unlike
    if (existingLike) {
      const deletedLike = await Like.findOneAndDelete(
        { _id: existingLike._id },
        { session }
      );
      console.log("deletedLike===>", deletedLike);

      await Model.findByIdAndUpdate(
        targetId,
        { $inc: { likeCount: -1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(
        new ApiResponse(200, {
          message: "Unliked Successfully",
        })
      );
    } else {
      //like
      const newLike = new Like({ userId, targetId, targetType });
      await newLike.save({ session });

      await Model.findByIdAndUpdate(
        targetId,
        { $inc: { likeCount: 1 } },
        {
          session,
        }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(
        new ApiResponse(200, {
          message: "Liked Successfully",
        })
      );
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(
      500,
      "An error occurred while toggling the like.",
      error
    );
  }
});

// get all liked users
const getAllLikes = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const Model = targetType === "Post" ? Post : Challenge;

  const target = await Model.findById(targetId);

  if (!target) {
    throw new ApiError(404, "target post not found");
  }

  const likesPromises = await Like.find({ targetId, targetType })
    .populate("userId", "fullName username profileImage")
    .populate("targetId", "-imagePublicId")
    .skip(skip)
    .limit(limit);

  const totalLikePromises = await Like.countDocuments({ targetId, targetType });

  const [likes, totalLikes] = await Promise.all([
    likesPromises,
    totalLikePromises,
  ]);

  const totalPages = Math.ceil(totalLikes / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      likes,
      totalLikes,
      totalPages,
    })
  );
});

export { toggleLike, getAllLikes };
