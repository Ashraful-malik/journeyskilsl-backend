import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Follower } from "../models/follower.model.js";
import { Following } from "../models/following.model.js";

const followUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id; //The user who wants to follow
  const targetId = req.params.userId; //the user to be followed

  if (!targetId) {
    throw new ApiError(400, "following id is required");
  }

  const followerId = new mongoose.Types.ObjectId(userId);
  const followingId = new mongoose.Types.ObjectId(targetId);

  console.log("followerId,followingId====>", followerId, followingId);

  if (followerId === followingId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  try {
    // console.log("entering in try catch");

    // Check if the follow relationship already exists
    const existingFollower = await Follower.findOne({
      user: followingId,
      follower: followerId, // Make sure this matches your schema
    });

    console.log("existingFollower===>", existingFollower);

    if (existingFollower) {
      throw new ApiError(400, "You are already following this user");
    }

    // Other logic continues here
    // throw new ApiError(409, "You are already following this use");

    // Add to followers of the followed user
    // const newFollower = await Follower.create({
    //   user: followingId,
    //   follower: followerId,
    // });

    // console.log("new Follower===>", newFollower);

    // Add to followings of the follower user
    // await Following.create({
    //   user: followerId,
    //   following: followingId,
    // });
    // Increment follower and following counts
    // await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });

    // await User.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } });

    // await session.commitTransaction();
    // session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Followed user successfully"));
  } catch (error) {
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
