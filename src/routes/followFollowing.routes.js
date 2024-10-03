import { Router } from "express";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../controllers/follow.controller.js";

router.route("/follow/:userId").post(verifyJWT, followUser);
router.route("/unfollow/:userId").post(verifyJWT, unfollowUser);

// // Get followers of a user
router.get("/:userId/followers", verifyJWT, getFollowers);
// Get users that a specific user is following
router.get("/:userId/following", verifyJWT, getFollowing);

export default router;
