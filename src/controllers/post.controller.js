import { Badge } from "../models/badge.model.js";
import { Challenge } from "../models/challenge.model.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  startSession,
  commitSession,
  abortSession,
} from "../utils/sessionUtils.js";

import {
  uploadOnCloudinary,
  deleteFileOnCloudinary,
} from "../utils/cloudinary.js";
import { deleteTemporaryFile } from "../utils/deleteTemporaryFile.js";

//create new post
const createPost = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { text, link } = req.body;
  const userId = req.user?._id;

  if (!text && !req.file) {
    throw new ApiError(400, "text or image is required");
  }

  if (!challengeId) {
    throw new ApiError(400, "challenge id is required");
  }

  const session = await startSession(); // Start session

  try {
    // Parallelize image compression and uploading
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const imageLocalPath = req.file.path;
      const uploadedImage = await uploadOnCloudinary(
        imageLocalPath,
        "profile_Image"
      );

      if (!uploadedImage) {
        deleteTemporaryFile(imageLocalPath);
        throw new ApiError(500, "Error while uploading image to Cloudinary.");
      }
      imageUrl = uploadedImage.url;
      imagePublicId = uploadedImage.publicId;
      deleteTemporaryFile(imageLocalPath);
    }

    // Fetch challenge and user in parallel
    const [user, challenge] = await Promise.all([
      User.findById(userId).session(session),
      Challenge.findById(challengeId).session(session),
    ]);

    if (!user || !challenge) {
      throw new ApiError("404", "User or challenge not found");
    }

    // If the challenge is already completed
    if (challenge.isCompleted) {
      return res.status(400).json({ message: "Challenge already completed" });
    }

    // Create a new post
    const newPost = new Post({
      owner: userId,
      text: text || "",
      image: imageUrl || "",
      link: link || "",
      challengeId: challengeId,
      imagePublicId: imagePublicId || "",
    });

    // Save post and log task in challenge

    challenge.taskLogs.push({
      taskId: newPost._id,
      completionDate: new Date(),
    });

    challenge.tasksCompleted += 1;

    // Handle streak logic
    const now = new Date();
    const lastActiveDate = challenge.lastActivityDate
      ? new Date(challenge.lastActivityDate)
      : null;

    const requiredInterval =
      challenge.consistencyIncentiveDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Check if the last activity date is on the same day as now
    const isSameDay =
      lastActiveDate &&
      now.toDateString() === new Date(lastActiveDate).toDateString();

    if (!isSameDay) {
      if (
        !lastActiveDate ||
        now - new Date(lastActiveDate) <= requiredInterval
      ) {
        challenge.currentStreak += 1;
      } else {
        challenge.currentStreak = 1;
      }
    }
    challenge.lastActivityDate = now;

    //Add badge if completed streak days

    const streakMilestones = [3, 7, 14, 21, 30, 60, 90]; // Predefined streak milestones
    if (streakMilestones.includes(challenge.currentStreak)) {
      const badge = await Badge.findOne({
        streak: challenge.currentStreak,
      }).session(session);

      if (badge && !user.badges.includes(badge._id)) {
        user.badges.push(badge._id);
        await user.save({ session });
      }
    }

    // Check if task requirements and consistency met
    const isTasksCompleted =
      challenge.tasksCompleted >= challenge.tasksRequired;

    const isConsistencyMet =
      challenge.currentStreak >= challenge.consistencyIncentiveDays;

    if (isTasksCompleted && isConsistencyMet) {
      challenge.isCompleted = true;
      challenge.completionDate = new Date();
    }

    // Save challenge and post in parallel
    const [savedPost] = await Promise.all([
      newPost.save({ session }),
      challenge.save({ session }),
    ]);

    await commitSession(session);

    const responsePost = {
      _id: savedPost._id,
      owner: savedPost.owner,
      text: savedPost.text,
      image: savedPost.image,
      link: savedPost.link,
      challengeId: savedPost.challengeId,
      createdAt: savedPost.createdAt,
      updatedAt: savedPost.updatedAt,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { post: responsePost },
          "Post created successfully"
        )
      );
  } catch (error) {
    await abortSession(session);
    console.error(error);
    throw new ApiError(400, error.message || "error in post creation");
  }
});

//edit post
const editPost = asyncHandler(async (req, res) => {
  const { text, link } = req.body;
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "post id is required");
  }

  if (!text && !link != null && !req.file) {
    throw new ApiError(400, "text, link or image is required");
  }
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  if (post.imagePublicId) {
    await deleteFileOnCloudinary(post.imagePublicId);
  }

  let imageUrl = null;
  let imagePublicId = null;

  if (req.file) {
    const imageLocalPath = req.file.path;
    const uploadedImage = await uploadOnCloudinary(
      imageLocalPath,
      "profile_Image"
    );

    if (!uploadedImage) {
      deleteTemporaryFile(imageLocalPath);
      throw new ApiError(500, "Error while uploading image to Cloudinary.");
    }
    imageUrl = uploadedImage.url;
    imagePublicId = uploadedImage.publicId;

    deleteTemporaryFile(imageLocalPath);
  }

  // If the user is providing a new text value, update the post's text field
  // otherwise, keep the existing text value
  post.text = text ? text : post.text;
  post.link = link ? link : post.link;
  post.image = imageUrl ? imageUrl : post.image;
  post.imagePublicId = imagePublicId ? imagePublicId : post.imagePublicId;

  const updatedPost = await post.save();
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "post updated successfully"));
});

//delete post
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "post id is required");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  const deletePost = await Post.deleteOne({ _id: postId });

  if (deletePost) {
    await deleteFileOnCloudinary(post.imagePublicId);
  }
  if (!deletePost) {
    throw new ApiError(400, "failed to delete post");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "post deleted successfully"));
});

const getAllUserPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const userId = req.user?._id;

  try {
    const posts = await Post.find({ owner: userId })
      .select("-imagePublicId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("owner", "fullName username profileImage")
      .populate("challengeId", "challengeName");

    const totalPost = await Post.countDocuments({ owner: userId });
    const totalPage = Math.ceil(totalPost / limit);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { posts, totalPost, totalPage },
          "posts fetched successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(400, error, "Failed to get posts. Please try again.");
  }
});

const getPublicFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Fetch public posts and challenges
  const [posts, challenges] = await Promise.all([
    Post.find()
      .select("-imagePublicId")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("owner", "fullName username profileImage"),
    Challenge.find({ isPublic: true })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("challengeOwner", "fullName username profileImage "),
  ]);

  const totalItems = posts.length + challenges.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { posts, challenges, totalItems },
        "Feed fetched successfully"
      )
    );
});

export { createPost, editPost, deletePost, getAllUserPosts, getPublicFeed };
