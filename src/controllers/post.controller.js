import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFileOnCloudinary,
} from "../utils/cloudinary.js";
import { compressImage } from "../utils/compressImage.js";
import { deleteTemporaryFile } from "../utils/deleteTemporaryFile.js";

const createPost = asyncHandler(async (req, res) => {
  const { text, link, challengeId } = req.body;
  const userId = req.user?._id;

  if (!text && !req.file) {
    throw new ApiError(400, "text or image is required");
  }

  let image = null;
  if (req.file) {
    const imagePath = req.file.path;
    const outputFilePath = `./public/temp/compressed_${req.file.filename}`;

    //compress image
    const compressImageLocalPath = await compressImage(
      imagePath,
      outputFilePath
    );

    if (!compressImageLocalPath) {
      throw new ApiError(
        400,
        "Error while compressing image. Please try again with a valid image file."
      );
    }

    const uploadedImage = await uploadOnCloudinary(
      compressImageLocalPath,
      "post_Images"
    );

    if (!uploadedImage) {
      throw new ApiError(400, "Error while uploading image on cloudinary");
    }

    deleteTemporaryFile(req.file.path);

    image = uploadedImage;
  }

  const newPost = new Post({
    owner: userId,
    text: text || "",
    image: image ? image.url : "",
    link: link || "",
    challengeId: challengeId,
    imagePublicId: image ? image.publicId : "",
  });

  const savedPost = await newPost.save();

  return res
    .status(200)
    .json(new ApiResponse(200, savedPost, "post created successfully"));
});

//edit post
const editPost = asyncHandler(async (req, res) => {
  const { text, link } = req.body;
  const postId = req.params.post;
  const userId = req.user?._id;

  if (!postId) {
    throw new ApiError(400, "post id is required");
  }
  if (!text && !link != null && !req.file) {
    throw new ApiError(400, "text, link or image is required");
  }
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  if (post.imagePublicId) {
    await deleteFileOnCloudinary(post.imagePublicId);
  }

  let image = null;

  if (req.file) {
    const imagePath = req.file.path;
    const outputFilePath = `./public/temp/compressed_${req.file.filename}`;

    //compress image
    const compressImageLocalPath = await compressImage(
      imagePath,
      outputFilePath
    );

    if (!compressImageLocalPath) {
      throw new ApiError(
        400,
        "Error while compressing image. Please try again with a valid image file."
      );
    }

    const uploadedImage = await uploadOnCloudinary(
      compressImageLocalPath,
      "post_Images"
    );

    if (!uploadedImage) {
      throw new ApiError(400, "Error while uploading image on cloudinary");
    }

    deleteTemporaryFile(req.file.path);

    image = uploadedImage;
  }

  // If the user is providing a new text value, update the post's text field
  // otherwise, keep the existing text value
  post.text = text ? text : post.text;
  post.link = link ? link : post.link;
  post.image = image ? image.url : post.image;
  post.imagePublicId = image ? image.publicId : post.imagePublicId;

  const updatedPost = await post.save();
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "post updated successfully"));
});

export { createPost, editPost };
