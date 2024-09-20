import { Router } from "express";
import {
  createChallenge,
  deleteChallenge,
  getAllChallenges,
  getAllUserChallenges,
  updateChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { useChallengeAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.route("/create-challenge").post(verifyJWT, createChallenge);
router.route("/update-challenge/:id").put(verifyJWT, updateChallenge);
router.route("/delete-challenge/:id").delete(verifyJWT, deleteChallenge);
router.route("/challenges:id").get(verifyJWT, getAllUserChallenges);
router.route("/challenges").get(getAllChallenges);
router
  .route("/challenge-analytics/:challengeId")
  .get(verifyJWT, useChallengeAnalytics);

export default router;
