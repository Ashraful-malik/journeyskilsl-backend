import { Router } from "express";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  followUser,
  unFollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/followFollowing.controller.js";

router.route("/follow/:userId").post(verifyJWT, followUser);
router.route("/unfollow/:userId").post(verifyJWT, unFollowUser);
router.route("/followers/:userId").get(verifyJWT, getFollowers);
router.route("/following/:userId").get(verifyJWT, getFollowing);

export default router;
