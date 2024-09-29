import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNewVerificationCode } from "../utils/generateNewVerificationCode.controller.js";
import { sendEmail } from "../utils/sendEmail.js";

const requestNewVerificationCode = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  const existingCode = await Verification.findById({ userId });

  if (existingCode) {
    // Check if the existing code is expired
    if (existingCode.verificationExpires < Date.now()) {
      // Code is expired, generate a new one
      const verificationCode = await generateNewVerificationCode(userId);

      // Send verification email
      await sendEmail({
        to: user.email,
        name: user.fullName,
        templateId: 1,
        params: {
          verification_code: verificationCode, // Pass the generated verification code
          name: user.fullName.split(" ")[0], // Example of another parameter
        },
      });
      return res
        .status(200)
        .json(new ApiResponse(200, "A new verification code has been sent."));
    } else {
      // Code is still valid
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "Your current verification code is still valid. Please use it or wait until it expires to generate a new one."
          )
        );
    }
  } else {
    const verificationCode = await generateNewVerificationCode(userId);
    // Send verification email
    await sendEmail({
      to: user.email,
      name: user.fullName,
      templateId: 1,
      params: {
        verification_code: verificationCode, // Pass the generated verification code
        name: user.fullName.split(" ")[0], // Example of another parameter
      },
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "A new verification code has been sent."));
  }
});

export { requestNewVerificationCode };
