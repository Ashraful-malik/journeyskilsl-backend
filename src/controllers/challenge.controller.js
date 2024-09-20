import { Tag } from "../models/tag.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Challenge } from "../models/createChallenge.model.js";

const calculateEndDate = async (days) => {
  const endDate = new Date();
  return endDate.setDate(endDate.getDate() + days);
};

//createOrUpdateTags
const createOrUpdateTags = async (tags, challenge) => {
  if (Array.isArray(tags)) {
    const TagIds = [];

    for (const tag of tags) {
      if (!tag.trim()) {
        throw new ApiError(400, "Tag tag cannot be empty.");
      }

      let hashtag = await Tag.findOne({ tag: tag.toLowerCase().trim() });
      // console.log("Tag=>", hashtag);

      if (!hashtag) {
        const saveTag = new Tag({ tag: tag.toLowerCase().trim() });
        await saveTag.save();
      }
      // Ensure the Tag is linked to the challenge
      if (hashtag.challenge.length === 0) {
        hashtag.challenge.push(challenge._id);
        await hashtag.save();
      }

      TagIds.push(hashtag._id);
    }
    return TagIds;
  }
};

//removeUnlinkedTags
const removeUnlinkedTags = async () => {
  try {
    const allTags = await Tag.find({});

    // Loop through each tag and check if it's linked to any challenge
    for (const tag of allTags) {
      const isLinked = await Challenge.exists({ tags: tag._id });

      if (!isLinked) {
        await Tag.deleteOne({ _id: tag._id });
        // console.log(`Deleted unlinked Tag: ${tag.tag}`);
      }
    }
    // console.log("Finished removing unlinked Tags.");
  } catch (error) {
    throw new ApiError(400, error, "Error removing unlinked Tags");
  }
};

//calculatePostsRequired
function calculatePostsRequired(durationInDays, postsPerInterval) {
  return Math.floor(durationInDays / postsPerInterval); // Example: 45 days -> 15 posts
}

//create challenge
const createChallenge = asyncHandler(async (req, res) => {
  const { challengeName, description, days, tags, isPublic } = req.body;
  const userId = req.user?._id;
  const tasksRequired = calculatePostsRequired(days, 2); // Automatically calculated

  console.log(challengeName);

  // Input validation
  if (
    !challengeName ||
    !description ||
    !days ||
    !isPublic ||
    !Array.isArray(tags)
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
  const endDate = await calculateEndDate(days);
  const consistencyIncentiveDays = Math.ceil(days / tasksRequired);

  try {
    const challenge = new Challenge({
      challengeOwner: userId,
      challengeName,
      description,
      endDate,
      days,
      isPublic: isPublicBoolean,
      tasksRequired,
      consistencyIncentiveDays,
    });

    const updatedTagIds = await createOrUpdateTags(tags || [], challenge);

    challenge.tags = updatedTagIds;
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
  const { challengeName, description, days, tags, isPublic } = req.body;
  const { id } = req.params; // Challenge ID from the URL

  if (!challengeName && !description && !days && !tags && !isPublic) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update." });
  }

  if (days !== undefined && days <= 0) {
    throw new ApiError(
      400,
      "Days should be a positive number. Please enter a positive number."
    );
  }
  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    if (challengeName) challenge.challengeName = challengeName;
    if (description) challenge.description = description;
    if (isPublic) challenge.isPublic = isPublic;
    if (days) challenge.days = days;
    if (days) {
      challenge.endDate = await calculateEndDate(days);
    }
    const updatedTagIds = await createOrUpdateTags(tags || [], challenge);

    challenge.tags = updatedTagIds;
    const updatedChallenge = await challenge.save();

    await removeUnlinkedTags();

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedChallenge, "challenge update successfully")
      );
  } catch (error) {
    console.log(error.message);

    throw new ApiError(
      400,
      error.message,
      "'Failed to update challenge. Please try again.' "
    );
  }
});

const deleteChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new ApiError(404, "Challenge not found");
    }

    const deletedChallenge = await Challenge.deleteOne({ _id: id });
    await removeUnlinkedTags();

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedChallenge, "challenge deleted successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      error,
      "Failed to delete challenge. Please try again."
    );
  }
});

const getAllUserChallenges = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.params;
  const skip = (page - 1) * limit;

  try {
    const challenges = await Challenge.find({ challengeOwner: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("challengeOwner")

      .populate("hashtags");

    if (!challenges) {
      throw new ApiError(404, "Challenges not found");
    }

    const total = await Challenge.countDocuments({ challengeOwner: userId });
    const totalPages = Math.ceil(total / limit);
    return res
      .status(200)
      .json(new ApiResponse(200, { challenges, totalPages }));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      error,
      "Failed to get challenges. Please try again."
    );
  }
});

//get all challenges
const getAllChallenges = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const pipeline = [
      { $match: { isPublic: true } },
      {
        $lookup: {
          from: "users",
          localField: "challengeOwner",
          foreignField: "_id",
          as: "owner",
        },
      },
      // Unwind the user array (since $lookup returns an array)
      { $unwind: "$owner" },

      {
        $lookup: {
          from: "Tag",
          localField: "tags",
          foreignField: "_id",
          as: "allChallengeHashtags",
        },
      },
      {
        $project: {
          "owner._id": 1,
          "owner.fullName": 1,
          "owner.username": 1,
          "owner.profileImage": 1,
          challengeName: 1,
          description: 1,
          hashtags: 1,
          createdAt: 1,
          endDate: 1,
          "allChallengeHashtags.tag": 1,
        },
      },

      {
        $facet: {
          // $facet is an aggregation operator that allows you to split the data into multiple groups and perform different aggregation operations on each group
          // It returns an object with a single field for each group, where the value of the field is an array of documents that belong to that group
          // In this case, we are grouping by the "allHashtags" field and returning an array of all the tags associated with each challenge
          challenges: [
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const result = await Challenge.aggregate(pipeline);

    const allChallenges = result[0].challenges;
    const total =
      result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

    const totalPages = Math.ceil(total / limit);

    if (!allChallenges || allChallenges.length === 0) {
      throw new ApiError(404, "No challenge found");
    }
    return res.status(200).json(
      new ApiResponse(200, {
        allChallenges,
        currentPage: page,
        totalPages: totalPages,
        totalCalledChallenges: total,
      })
    );
  } catch (error) {
    console.log(error);
    throw new ApiError("500", "An error occurred while receiving challenges");
  }
});

export {
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getAllUserChallenges,
  getAllChallenges,
};
