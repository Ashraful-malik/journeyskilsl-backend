import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const verifyEmail = asyncHandler(async (req, res, next) => {
  const { userId, code } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const objectId = new mongoose.Types.ObjectId(userId);

  try {
    const [user, verification] = await Promise.all([
      User.findById(userId).select("isVerified"),
      Verification.findOne({ userId: objectId }),
    ]);

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    if (!verification) {
      throw new ApiError(400, "Verification record not found or expired");
    }

    if (
      verification.verificationExpires < Date.now() ||
      verification.verificationCode !== code
    ) {
      throw new ApiError(400, "Invalid or expired verification code");
    }

    // Clear 2FA code after successful verification
    verification.verificationCode = undefined;
    verification.verificationExpires = undefined;
    user.isVerified = true;

    // Save user and verification
    await Promise.all([verification.save(), user.save()]);

    return res
      .status(200)
      .json(new ApiResponse(200, "Email verified successfully"));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Email verification error", error.message));
  }
});

export { verifyEmail };
