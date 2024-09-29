import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { LAUNCH_END_DATE, LAUNCH_START_DATE } from "../constants.js";
import {
  deleteFileOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import { generateAccessAndRefreshToken } from "../utils/jwtToken.js";
import { generateNewVerificationCode } from "../utils/generateNewVerificationCode.controller.js";
import { Verification } from "../models/verification.model.js";
import {
  abortSession,
  commitSession,
  startSession,
} from "../utils/sessionUtils.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const session = startSession();
  // Concurrently check if user exists by email or username
  try {
    const existedUser = await User.findOne({
      $or: [{ email: email }, { username: username.toLowerCase() }],
    })
      .select("_id")
      .session(session);

    if (existedUser) {
      throw new ApiError(409, "User already exist");
    }

    const user = await User.create(
      [
        {
          fullName,
          email,
          password,
          username: username.toLowerCase(),
        },
      ],
      { session }
    );
    // Handle badge assignment if within launch date range
    const CURRENT_DATE = new Date();
    if (CURRENT_DATE >= LAUNCH_START_DATE && CURRENT_DATE <= LAUNCH_END_DATE) {
      user[0].badges.push(process.env.EARLY_USER_BADGE_ID);
      await user[0].save({ session, validateBeforeSave: false });
    }

    // Handle verification code logic
    const existingCode = await Verification.findById(user[0].id).session(
      session
    );
    const verificationCode =
      existingCode && existingCode.verificationExpires > Date.now()
        ? existingCode.code
        : await generateNewVerificationCode(user[0]._id, session);

    // Send verification email
    await sendEmail({
      to: user[0].email,
      name: user[0].fullName,
      templateId: 1,
      params: {
        verification_code: verificationCode, // Pass the generated verification code
        name: user[0].fullName.split(" ")[0], // Example of another parameter
      },
    });
    await commitSession(session);

    const createdUser = await User.findById(user._id).select(
      "-password -profileImagePublicId"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User registered successfully. A verification code has been sent to your email."
        )
      );
  } catch (error) {
    await abortSession(session); // Roll back changes if any error occurs
    throw new ApiError(400, error.message || "error in post creation");
  } finally {
    await session.endSession(); // End the session
  }
});

// login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  if (!user.isVerified) {
    const existingCode = await Verification.findById(user.id);
    if (!existingCode && !existingCode.verificationExpires > Date.now()) {
      const verificationCode = await generateNewVerificationCode(user._id);
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
        .json(
          new ApiResponse(
            200,
            "You are not verified. A verification code has been sent to your email. Please enter the code to complete the verification process."
          )
        );
    } else {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "Your current verification code is still valid. Please use it or wait until it expires to generate a new one."
          )
        );
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully "));
});

//Generate new refresh and accessToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError("401", error?.message || "invalid refresh token");
  }
});

//get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const getUserDate = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const user = await User.findById(userId)
    .populate("badges")
    .select(
      "-password -refreshToken -coverImagePublicId -profileImagePublicId"
    );
  if (!user) {
    throw ApiError(404, "user not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "user fetch successfully"));
});

// change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed Successfully"));
});

//change email address
const changeCurrentEmail = asyncHandler(async (req, res) => {
  const newEmail = req.body;
  const userId = req.user?._id;

  if (!newEmail) {
    throw new ApiError(400, "Email address is required");
  }

  const updatedEmail = await User.findOneAndUpdate(
    { _id: userId, email: { $ne: newEmail } }, //$ne operator means not equal
    { email },
    { new: true }
  ).select("-passwords");

  if (!updatedEmail) {
    throw new ApiError(409, "Email address already in use");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedEmail, "email change successfully"));
});

// update user details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName, bio, dob, location } = req.body;

  if (!username && !fullName && !bio && !dob && !location) {
    throw new ApiError(400, "Fields cannot be empty");
  }

  const updateFields = {};

  if (username) updateFields.username = username;
  if (fullName) updateFields.fullName = fullName;
  if (bio) updateFields.bio = bio;
  if (dob) updateFields.dob = dob;
  if (location) updateFields.location = location;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },

    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "user details updated successfully"));
});

//update profile image
const updateUserProfileImage = asyncHandler(async (req, res) => {
  const profileImageLocalPath = req.file?.path;
  const userId = req.user?._id;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "profile image is missing");
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.profileImagePublicId) {
    await deleteFileOnCloudinary(user.profileImagePublicId);
  }

  // Upload the new profile picture
  const newProfileImage = await uploadOnCloudinary(
    profileImageLocalPath,
    "profile_Image"
  );
  if (!newProfileImage) {
    throw new ApiError(400, "Error while uploading on Avatar");
  }

  user.profileImage = newProfileImage.url;
  user.profileImagePublicId = newProfileImage.publicId;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile Image Updated Successfully"));
});

//update coverImage
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const userId = req.user?._id;

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.profileImagePublicId) {
    await deleteFileOnCloudinary(user.coverImagePublicId);
  }

  const newCoverImage = await uploadOnCloudinary(
    coverImageLocalPath,
    "cover_image"
  );

  if (!newCoverImage) {
    throw new ApiError(400, "Error while uploading on Avatar");
  }

  user.coverImage = newCoverImage.url;
  user.coverImagePublicId = newCoverImage.publicId;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserProfileImage,
  updateCoverImage,
  changeCurrentEmail,
  getUserDate,
};
