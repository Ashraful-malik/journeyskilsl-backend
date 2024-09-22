import { Router } from "express";
import {
  createChallenge,
  deleteChallenge,
  getAllChallenges,
  getAllUserChallenges,
  updateChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { userChallengeAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.route("/create-challenge").post(verifyJWT, createChallenge);
router.route("/update-challenge/:id").put(verifyJWT, updateChallenge);
router.route("/delete-challenge/:id").delete(verifyJWT, deleteChallenge);
router.route("/user-challenges/:id").get(verifyJWT, getAllUserChallenges);

// Public route (no verifyJWT)
router.route("/challenges").get(getAllChallenges);

// Analytics route
router
  .route("/challenge-analytics/:challengeId")
  .get(verifyJWT, userChallengeAnalytics);

export default router;
