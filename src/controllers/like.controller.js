import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";

// toggle like and unlike
const toggleLike = asyncHandler(async (req, res) => {
  const { targetId, targetType } = req.body;
  const userId = req.user?._id;
  const existingLikes = Like.findOne({ userId, targetId, targetType });

  if (existingLikes) {
    await Like.deleteOne({ _id: existingLikes._id });
    return res.status(200).json({ message: "Unliked successfully" });
  } else {
    const newLike = new Like({ userId, targetId, targetType });
    await newLike.save();
    //increasing like count in the target
    const Model = targetType === "Post" ? Post : Challenge;
    await Model.findByIdAndUpdate(targetId, { $inc: { likeCount: 1 } });

    return res.status(200).json({ message: "Liked successfully" });
  }
});

// get all like  counts
const getAllLikes = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;
  const likes = await Like.find({ targetId, targetType });
  if (!likes) {
    throw new ApiError(404, "No likes found");
  }

  return res.status(200).json(new ApiResponse(200, { likes }));
});

// get all liked users
const getAllLikesUsers = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const Model = targetType === "Post" ? Post : Challenge;

  const target = await Model.findById(targetId);
  if (!target) {
    throw new ApiError(404, "target not found");
  }

  const likes = await Like.find({ targetId, targetType })
    .populate("userId")
    .select("-password -refreshToken -profileImage -profileImagePublicId")
    .skip(skip)
    .limit(limit);

  const totalLikes = await Like.countDocuments({ targetId, targetType });

  const totalPages = Math.ceil(totalLikes / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      likes,
      totalLikes,
      totalPages,
    })
  );
});

export { toggleLike, getAllLikesUsers, getAllLikes };
