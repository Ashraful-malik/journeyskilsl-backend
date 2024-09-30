import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNewVerificationCode } from "../utils/generateNewVerificationCode.controller.js";
import { sendEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";

const requestNewVerificationCode = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "id is required");
  }

  // Convert id to ObjectId
  const objectId = new mongoose.Types.ObjectId(id);

  // Fetch user and verification document in parallel
  const existingCode = await Verification.findOne({ userId: objectId });
  const user = await User.findById(objectId);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (existingCode) {
    if (existingCode.verificationExpires < Date.now()) {
      // Code is still valid
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "Your current verification code is still valid. Please use it or wait until it expires to generate a new one."
          )
        );
    } else {
      // If expired, delete it
      await Verification.findOneAndDelete({
        userId: objectId,
      });
    }
  }

  // Generate a new verification code and save it
  const verificationCode = await generateNewVerificationCode(id);

  // Send verification email
  await sendEmail({
    to: user.email,
    name: user.fullName,
    templateId: 1,
    params: {
      verification_code: verificationCode,
      name: user.fullName.split(" ")[0],
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "A new verification code has been sent."));
});

export { requestNewVerificationCode };
