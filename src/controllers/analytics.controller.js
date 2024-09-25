import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Challenge } from "../models/challenge.model.js";
import mongoose from "mongoose";

const userChallengeAnalytics = asyncHandler(async (req, res) => {
  const challengeId = req.params?.challengeId;
  const userId = req.user?._id;

  if (!challengeId) {
    throw new ApiError(400, "challenge id and user id is required");
  }
  try {
    const analytic = await Challenge.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(challengeId),
          challengeOwner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          challengeName: 1,
          totalTasks: "$tasksRequired",
          completedTasks: "$tasksCompleted",
          completionRate: {
            $multiply: [
              { $divide: ["$tasksCompleted", "$tasksRequired"] },
              100,
            ],
          },
          currentStreak: 1,
          consistencyIncentiveDays: 1,
          isCompleted: 1,
          lastActivityDate: 1,
          completionDate: 1,
          completionDate: 1,
          isPublic: 1,
          startDate: 1,
          viewCount: 1,
        },
      },
    ]);

    const result = analytic[0];
    console.log(analytic);

    return res
      .status(200)
      .json(new ApiResponse(200, { analytic: result }, "Challenge analytics"));
  } catch (error) {
    throw new ApiError(500, error, "Error in challenge analytics");
  }
});

export { userChallengeAnalytics };
