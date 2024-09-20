import { Router } from "express";
import {
  savePostAndChallenge,
  unsavePostAndChallenge,
  getSavedItems,
} from "../controllers/save.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/save-post-and-challenge").post(verifyJWT, savePostAndChallenge);
router
  .route("/unsave-post-and-challenge")
  .get(verifyJWT, unsavePostAndChallenge);

router.route("/get-saved-items").get(verifyJWT, getSavedItems);
