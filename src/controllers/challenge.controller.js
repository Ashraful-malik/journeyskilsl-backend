import { Hashtag } from "../models/tag.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Challenge } from "../models/createChallenge.model.js";

const calculateEndDate = (days) => {
  const endDate = new Date();
  return endDate.setDate(endDate.getDate() + days);
};

const createOrUpdateHashtags = async (hashtags) => {
  const hashtagIds = [];

  for (const tag of hashtags) {
    if (!tag.trim()) {
      throw new ApiError(400, "Hashtag tag cannot be empty.");
    }

    let hashtag = await Hashtag.findOne({ tag: tag.toLowerCase().trim() });

    if (!hashtag) {
      hashtag = new Hashtag({ tag: tag.toLowerCase().trim() });
      await hashtag.save();
    }

    hashtagIds.push(hashtag._id);
  }

  return hashtagIds;
};

const createChallenge = asyncHandler(async (req, res) => {
  const { challengeName, description, days, hashtags, isPublic } = req.body;
  const userId = req.user?._id;

  // Input validation
  if (
    !userId ||
    !challengeName ||
    !description ||
    !days ||
    !isPublic ||
    !Array.isArray(hashtags)
  ) {
    throw new ApiError(400, "all field are required");
  }

  if (days <= 0) {
    throw new ApiError(400, " be a positive number.'");
  }
  // Convert isPublic to Boolean if it's a string
  const isPublicBoolean =
    typeof isPublic === "string"
      ? isPublic.toLowerCase() === "true"
      : Boolean(isPublic);

  //calculating end date
  const endDate = calculateEndDate(days);

  try {
    const challenge = new Challenge({
      challengeOwner: userId,
      challengeName,
      description,
      endDate,
      days,
      isPublic: isPublicBoolean,
    });
    const hashTagsIds = [];

    for (const tag of hashtags) {
      let hashtag = await Hashtag.findOne({ tag: tag.toLowerCase().trim() });

      if (!hashtag) {
        hashtag = new Hashtag({ tag: tag.toLowerCase().trim() });
        await hashtag.save();
      }
      await hashtag.challenge.push(challenge._id);
      await hashtag.save();
      hashTagsIds.push(hashtag._id);
    }
    challenge.hashtags = hashTagsIds;
    const saveChallenge = await challenge.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, saveChallenge, "challenge created successfully")
      );
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .json(
        new ApiError(
          400,
          { error },
          "Failed to create challenge. Please try again."
        )
      );
  }
});

//updating challenge
const updateChallenge = asyncHandler(async (req, res) => {
  const { challengeName, description, days, hashtags, isPublic } = req.body;
  const { id } = req.params; // Challenge ID from the URL

  if (!title && !description && !days && !hashtags && !isPublic) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update." });
  }

  if (days !== undefined && days <= 0) {
    throw new ApiError(400, "Days should be a positive number.");
  }
  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }
    if (title) challenge.challengeName = challengeName;
    if (description) challenge.description = description;
    if (days) {
      challenge.endDate = calculateEndDate(days);
    }

    const existingHashtags = challenge.hashtags.map((id) => id.toString()); // Convert ObjectId to string for comparison

    const hashtagIds = createOrUpdateHashtags(hashtags);

    // Remove old hashtags not in the updated list
    const hashtagsToRemove = existingHashtags.filter(
      (id) => !hashtagIds.includes(id)
    );

    for (const id of hashtagsToRemove) {
      await Hashtag.findByIdAndUpdate(id, {
        $pull: { challenges: challenge._id },
      });
    }
  } catch (error) {}
});

const deleteChallenge = asyncHandler(async (req, res) => {});

const getAllChallenges = asyncHandler(async (req, res) => {});

export { createChallenge, updateChallenge, deleteChallenge, getAllChallenges };
