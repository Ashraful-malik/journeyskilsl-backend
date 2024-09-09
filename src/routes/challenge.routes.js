import { Router } from "express";
import {
  createChallenge,
  deleteChallenge,
  getAllChallenges,
  getAllUserChallenges,
  updateChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-challenge").post(verifyJWT, createChallenge);
router.route("/update-challenge/:id").put(verifyJWT, updateChallenge);
router.route("/delete-challenge/:id").delete(verifyJWT, deleteChallenge);
router.route("/challenges:id").get(verifyJWT, getAllUserChallenges);
router.route("/challenges").get(getAllChallenges);

export default router;
