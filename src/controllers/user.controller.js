import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = User.findOne({
    $or: [{ username }, { email }], //$or parameter use for validate both username and email
  });
  if (existedUser) {
    throw new ApiError(409, "User already exist");
  }
  const profilePicLocalPath = req.files?.profilePic[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!profilePicLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const profilePic = await uploadOnCloudinary(profilePicLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!profilePic) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    profilePic: profilePic.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something while wrong while registering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

export { registerUser };
