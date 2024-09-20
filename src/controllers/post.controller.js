import { Badge } from "../models/badge.model.js";
import { Challenge } from "../models/createChallenge.model.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFileOnCloudinary,
} from "../utils/cloudinary.js";
import { compressImage } from "../utils/compressImage.js";
import { deleteTemporaryFile } from "../utils/deleteTemporaryFile.js";

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

  try {
    // Parallelize image compression and uploading
    let imageUploadPromise = null;

    if (req.file) {
      const imagePath = req.file.path;
      const outputFilePath = `./public/temp/compressed_${req.file.filename}`;

      // Compress and upload in parallel
      imageUploadPromise = compressImage(imagePath, outputFilePath)
        .then((compressImageLocalPath) => {
          if (!compressImageLocalPath) {
            throw new ApiError(400, "Error while compressing image.");
          }

          return uploadOnCloudinary(compressImageLocalPath, "post_Images");
        })
        .catch((error) => {
          throw new ApiError(400, error, "Error in image processing.");
        });
    }

    // Fetch challenge and user in parallel
    const [user, challenge] = await Promise.all([
      User.findById(userId).select(
        "-email -password -refreshToken -profileImage -profileImagePublicId"
      ),
      Challenge.findById(challengeId),
    ]);

    if (!user || !challenge) {
      throw new ApiError("404", "User or challenge not found");
    }

    // If the challenge is already completed
    if (challenge.isCompleted) {
      return res.status(400).json({ message: "Challenge already completed" });
    }

    // Await image upload if necessary
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file && imageUploadPromise) {
      deleteTemporaryFile(req.file.path);
      const uploadedImage = await imageUploadPromise;
      imageUrl = uploadedImage?.url;
      imagePublicId = uploadedImage?.publicId;
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
    const savedPostPromise = newPost.save();

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
      const badge = await Badge.findOne({ streak: challenge.currentStreak });

      if (badge && !user.badges.includes(badge._id)) {
        user.badges.push(badge._id);
        await user.save();
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
    const [savedPost, savedChallenge] = await Promise.all([
      savedPostPromise,
      challenge.save(),
    ]);

    const responsePost = {
      _id: savedPost._id,
      owner: savedPost.owner,
      text: savedPost.text,
      image: savedPost.image,
      link: savedPost.link,
      challengeId: savedPost.challengeId,
      createdAt: savedPost.createdAt,
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
    console.error(error);
    throw new ApiError(400, error, "error in post creation");
  }
});

//edit post
const editPost = asyncHandler(async (req, res) => {
  const { text, link } = req.body;
  const postId = req.params.post;

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

  let image = null;

  if (req.file) {
    const imagePath = req.file.path;
    const outputFilePath = `./public/temp/compressed_${req.file.filename}`;

    //compress image
    const compressImageLocalPath = await compressImage(
      imagePath,
      outputFilePath
    );

    if (!compressImageLocalPath) {
      throw new ApiError(
        400,
        "Error while compressing image. Please try again with a valid image file."
      );
    }

    const uploadedImage = await uploadOnCloudinary(
      compressImageLocalPath,
      "post_Images"
    );

    if (!uploadedImage) {
      deleteTemporaryFile(req.file.path);
      throw new ApiError(400, "Error while uploading image on cloudinary");
    }

    deleteTemporaryFile(req.file.path);

    image = uploadedImage;
  }

  // If the user is providing a new text value, update the post's text field
  // otherwise, keep the existing text value
  post.text = text ? text : post.text;
  post.link = link ? link : post.link;
  post.image = image ? image.url : post.image;
  post.imagePublicId = image ? image.publicId : post.imagePublicId;

  const updatedPost = await post.save();
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "post updated successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "post id is required");
  }

  const post = await Post.findById(id);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  const deletePost = await Post.deleteOne({ _id: id });

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

export { createPost, editPost, deletePost };
