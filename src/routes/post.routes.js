import { Router } from "express";
import {
  createPost,
  deletePost,
  editPost,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/create-post/:challengeId")
  .post(verifyJWT, upload.single("image"), createPost);
router
  .route("/edit-post/:post")
  .put(verifyJWT, upload.single("image"), editPost);

router.route("/delete-post/:id").delete(verifyJWT, deletePost);

export default router;
