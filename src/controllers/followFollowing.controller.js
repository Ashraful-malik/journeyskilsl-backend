import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Follower } from "../models/follower.model.js";
import mongoose from "mongoose";
import { Following } from "../models/following.model.js";
import { User } from "../models/user.model.js";

const followUser = asyncHandler(async (req, res) => {
  const followerId = req.user?.id; //The user who wants to follow
  const followingId = req.params.userId; //the user to be followed

  if (!followingId) {
    throw new ApiError(400, "following id is required");
  }

  if (followerId.equal(followingId)) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the follow relationship already exists
    const existingFollower = await Follower.findById(
      [
        {
          user: followingId,
          follower: followerId,
        },
      ],
      { session }
    );

    if (existingFollower) {
      throw new ApiError(409, "you are already following this user");
    }
    // Add to followers of the followed user
    await Follower.create([{ user: followingId, follower: followerId }], {
      session,
    });

    // Add to followings of the follower user
    await Following.create([
      {
        user: followerId,
        following: followingId,
      },
    ]);
    // Increment follower and following counts
    await User.findByIdAndUpdate(
      followerId,
      { $inc: { followingCount: 1 } },
      { session }
    );

    await User.findByIdAndUpdate(
      followingId,
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
    throw new ApiError(
      500,
      "An error occurred while following the user",
      error
    );
  }
});

const unFollowUser = asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (!followingId) {
    throw new ApiError(400, "following id is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove from followers and following schemas
    await Follower.findByIdAndDelete(
      {
        user: followingId,
        follower: followerId,
      },
      { session }
    );

    await Following.findByIdAndDelete(
      {
        user: followerId,
        following: followingId,
      },
      { session }
    );
    // Decrement follower and following counts
    await User.findByIdAndUpdate(
      followerId,
      { $inc: { followingCount: -1 } },
      { session: {} }
    );

    await User.findByIdAndUpdate(
      followingId,
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
    session.endSession();
    throw new ApiError(
      500,
      "An error occurred while unfollowing the user",
      error
    );
  }
});

//get followers
// Get followers of a user
const getFollowers = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new ApiError(400, "user id is required");
    }

    const followers = await Follower.find({ user: userId }).populate(
      "follower",
      "username"
    );
    res.status(200).json({ followers });
  } catch (error) {
    throw new ApiError(500, error, "Failed to get followers");
  }
});

// Get users a specific user is following
const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const following = await Following.find({ user: userId }).populate(
    "following",
    "username"
  );
  res.status(200).json({ following });
});

export { followUser, unFollowUser, getFollowers, getFollowing };
