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
const createOrUpdateTags = async (Tags, challenge) => {
  if (Array.isArray(Tags)) {
    const TagIds = [];

    for (const tag of Tags) {
      if (!tag.trim()) {
        throw new ApiError(400, "Tag tag cannot be empty.");
      }

      let Tag = await Tag.findOne({ tag: tag.toLowerCase().trim() });

      if (!Tag) {
        Tag = new Tag({ tag: tag.toLowerCase().trim() });
        await Tag.save();
      }
      // Ensure the Tag is linked to the challenge
      if (Tag.challenge.length === 0) {
        Tag.challenge.push(challenge._id);
        await Tag.save();
      }

      TagIds.push(Tag._id);
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
      const isLinked = await Challenge.exists({ Tags: tag._id });

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

//create challenge
const createChallenge = asyncHandler(async (req, res) => {
  const { challengeName, description, days, Tags, isPublic } = req.body;
  const userId = req.user?._id;

  // Input validation
  if (
    !userId ||
    !challengeName ||
    !description ||
    !days ||
    !isPublic ||
    !Array.isArray(Tags)
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

  try {
    const challenge = new Challenge({
      challengeOwner: userId,
      challengeName,
      description,
      endDate,
      days,
      isPublic: isPublicBoolean,
    });

    const updatedTagIds = await createOrUpdateTags(Tags || [], challenge);

    challenge.Tags = updatedTagIds;
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
  const { challengeName, description, days, Tags, isPublic } = req.body;
  const { id } = req.params; // Challenge ID from the URL

  if (!challengeName && !description && !days && !Tags && !isPublic) {
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
    const updatedTagIds = await createOrUpdateTags(Tags || [], challenge);

    challenge.Tags = updatedTagIds;
    const updatedChallenge = await challenge.save();

    console.log("updatedChallenge", updatedChallenge.Tags);

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
  const userId = req.user?._id;
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

// const getAllChallenges = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   try {
//     const allChallenges = await Challenge.countDocuments({ isPublic: true })
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     if (!allChallenges || allChallenges.length === 0) {
//       return res.status(404).json({ error: "No challenges found." });
//     }
//     const total = await Challenge.countDocuments({ isPublic: true });
//     const totalPages = Math.ceil(total / limit);

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { allChallenges, currentPage: page, totalPages: totalPages,totalCalledChallenges:total },
//           "Challenge fetch successfully"
//         )
//       );
//   } catch (error) {
//     console.log(error);
//     throw new ApiError(500, "An error occurred while retrieving challenges.");
//   }
// });

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
          as: "user",
        },
      },
      { $unwind: $user },
      {
        $project: {
          "user._id": 1,
          "user.fullName": 1,
          "user.username": 1,
          "user.profileImage": 1,
          challengeName: 1,
          description: 1,
          createdAt: 1,
          endDate: 1,
        },
      },
      {
        $lookup: {
          from: "tags",
          localField: "hashtags",
          foreignField: "_id",
          as: "allHashtags",
        },
      },
      {},
    ];
  } catch (error) {}
});

export {
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getAllUserChallenges,
  getAllChallenges,
};
