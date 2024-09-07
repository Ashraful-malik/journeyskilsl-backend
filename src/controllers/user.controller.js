import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

import {
  deleteFileOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //$or parameter use for validate both username and email
  });

  if (existedUser) {
    throw new ApiError(409, "User already exist");
  }

  const profileImageLocalPath = req.files?.profileImage[0]?.path;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "profile image file is required");
  }

  const profileImage = await uploadOnCloudinary(
    profileImageLocalPath,
    "profile_Image"
  );

  if (!profileImage) {
    throw new ApiError(400, "profile image file is required");
  }

  const user = await User.create({
    fullName,
    profileImage: profileImage.url,
    profileImagePublicId: profileImage.publicId,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
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
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
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
};
