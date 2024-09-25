import { Router } from "express";

import {
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-comment/:contentType/:id").post(verifyJWT, createComment);
router.route("/update-comment/:commentId").put(verifyJWT, updateComment);
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);
router.route("/comments/:contentType/:id").get(verifyJWT, getAllComments);

export default router;
