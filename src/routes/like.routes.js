import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllLikes, toggleLike } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-like").post(verifyJWT, toggleLike);
router.route("/like-count").get(verifyJWT, getAllLikes);

export default router;
