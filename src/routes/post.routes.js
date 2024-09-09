import { Router } from "express";
import { createPost, editPost } from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/create-post")
  .post(verifyJWT, upload.single("image"), createPost);
router
  .route("/edit-post/:post")
  .post(verifyJWT, upload.single("image"), editPost);

export default router;
