import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyEmail = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  try {
    const [user, verification] = await Promise.all([
      User.findById(userId),
      Verification.findById(userId),
    ]);
    if (
      !user ||
      verification.verificationExpires < Date.now() ||
      verification.verificationCode !== code
    ) {
      throw ApiError(400, "Invalid or expired verification code");
    }
    // Clear 2FA code after successful verification
    verification.verificationCode = undefined;
    verification.verificationExpires = undefined;
    user.verified = true;
    await Promise.all[(await verification.save(), await user.save())];
    return res
      .status(200)
      .json(new ApiResponse(200, "Email verified successfully"));
  } catch (error) {
    console.error(error);
    throw ApiError(500, "Email verified Error", error);
  }
});
export { verifyEmail };
