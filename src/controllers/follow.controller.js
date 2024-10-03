import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Follower } from "../models/follower.model.js";
import { Following } from "../models/following.model.js";
import mongoose from "mongoose";

const followUser = asyncHandler(async (req, res) => {
  const followerId = req.user._id; // The user who wants to follow
  const userId = req.params.userId; // The user to be followed

  if (followerId.equals(userId)) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the follow relationship already exists
    const existingFollower = await Follower.findOne({
      user: userId,
      follower: followerId,
    });

    if (existingFollower) {
      throw new ApiError(409, "You are already following this user");
    }

    // Add to followers of the followed user
    await Follower.create([{ user: userId, follower: followerId }], {
      session,
    });

    // Add to followings of the follower user
    await Following.create([{ user: followerId, following: userId }], {
      session,
    });

    // Increment follower and following counts
    await User.findByIdAndUpdate(
      followerId,
      { $inc: { followingCount: 1 } },
      { session }
    );
    await User.findByIdAndUpdate(
      userId,
      { $inc: { followerCount: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Followed user successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    throw new ApiError(
      500,
      "An error occurred while following the user",
      error
    );
  }
});

const unfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(400, " User ID is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if follow relationship exists
    const existingFollower = await Follower.findOne({
      user: userId,
      follower: followerId,
    });

    if (!existingFollower) {
      throw new ApiError(400, "You are not following this user");
    }

    // Remove from followers and following schemas
    await Follower.findOneAndDelete(
      { user: userId, follower: followerId },
      { session }
    );

    await Following.findOneAndDelete(
      { user: followerId, following: userId },
      { session }
    );

    // Decrement follower and following counts
    await User.findByIdAndUpdate(
      followerId,
      { $inc: { followingCount: -1 } },
      { session }
    );
    await User.findByIdAndUpdate(
      userId,
      { $inc: { followerCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unfollowed user successfully"));
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    session.endSession();
    throw new ApiError(
      500,
      "An error occurred while unfollowing the user",
      error
    );
  }
});

// Get followers of a user
const getFollowers = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  const followers = await Follower.find({ user: userId })
    .populate("follower", "username profileImage fullName")
    .skip(skip)
    .limit(limit);
  res.status(200).json(new ApiResponse(200, { followers }));
});

const getFollowing = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const following = await Following.find({ user: userId })
    .populate("following", "username profileImage fullName")
    .skip(skip)
    .limit(limit);
  res.status(200).json(new ApiResponse(200, { following }));
});

export { followUser, unfollowUser, getFollowers, getFollowing };
