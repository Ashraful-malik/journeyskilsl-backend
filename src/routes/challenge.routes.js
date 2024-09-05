import { Router } from "express";
import {
  createChallenge,
  updateChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-challenge").post(verifyJWT, createChallenge);
router.route("/update/:id").put(verifyJWT, updateChallenge);

export default router;
