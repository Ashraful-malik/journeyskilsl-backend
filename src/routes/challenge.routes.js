import { Router } from "express";
import {
  createChallenge,
  deleteChallenge,
  getAllUserChallenges,
  updateChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-challenge").post(verifyJWT, createChallenge);
router.route("/update-challenge/:id").put(verifyJWT, updateChallenge);
router.route("/delete-challenge/:id").delete(verifyJWT, deleteChallenge);
router.route("/get-all-challenges").get(verifyJWT, getAllUserChallenges);
export default router;
