import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { Challenge } from "../models/challenge.model.js";

const createComment = asyncHandler(async (req, res) => {
  const { contentType, id } = req.params;
  console.log(contentType, id);

  const { content } = req.body;
  console.log(content);

  const userId = req.user?._id;

  if (!id) {
    throw new ApiError(400, " id is required");
  }

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  let comment;
  if (contentType === "post") {
    const post = await Post.findById(id);

    if (!post) {
      throw new ApiError(404, "post not found");
    }
    comment = new Comment({ content, commentBy: userId, post: id });
  } else if (contentType === "challenge") {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new ApiError(404, "challenge not found");
    }
    userComment = new Comment({ content, commentBy: userId, challenge: id });
  } else {
    res.status(201).json(new ApiResponse(201, comment, "comment created"));
  }

  await comment.save();
  return res.status(201).json(new ApiResponse(201, comment, "comment created"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const userId = req.user?._id;

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.findById(commentId);
  console.log(comment.commentBy.toString(), userId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (comment.commentBy.toString() !== userId.toString()) {
    throw new ApiError(401, "unauthorized");
  }

  comment.content = content;
  await comment.save();

  return res.status(200).json(new ApiResponse(200, comment, "comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (comment.commentBy.toString() !== userId.toString()) {
    throw new ApiError(401, "unauthorized");
  }
  const deletedComment = await Comment.deleteOne({ _id: commentId });
  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "comment deleted"));
});

const getAllComments = asyncHandler(async (req, res) => {
  const { contentType, id } = req.params;
  //id means post id or challenge id for finding all post and challenge comments

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let comment;
  if (contentType === "post") {
    comment = await Comment.find({ post: id })
      .populate("commentBy", "fullName username profileImage")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  } else if (contentType === "challenge") {
    comment = await comment
      .find({ challenge: id })
      .populate("commentBy", "fullName username profileImage")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  } else {
    throw new ApiError(400, "Invalid content type");
  }
  const totalComment = await Comment.countDocuments(
    contentType === "post" ? { post: id } : { challenge: id }
  );
  const totalPage = Math.ceil(totalComment / limit);
  console.log(totalComment, totalPage);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comment, totalComment, totalPage },
        "comment fetched successfully"
      )
    );
});

export { createComment, updateComment, deleteComment, getAllComments };
