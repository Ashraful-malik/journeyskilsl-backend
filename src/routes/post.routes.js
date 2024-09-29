import { Router } from "express";
import {
  createPost,
  deletePost,
  editPost,
  getAllUserPosts,
  getPublicFeed,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/create-post/:challengeId")
  .post(verifyJWT, upload.single("image"), createPost);
router
  .route("/edit-post/:postId")
  .put(verifyJWT, upload.single("image"), editPost);

router.route("/delete-post/:postId").delete(verifyJWT, deletePost);
router.route("/get-user-posts").get(verifyJWT, getAllUserPosts);

//get public feed posts and challenges
router.route("/get-public-feed").get(getPublicFeed);

export default router;
