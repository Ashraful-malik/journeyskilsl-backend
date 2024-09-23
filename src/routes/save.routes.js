import { Router } from "express";
import {
  savePostAndChallenge,
  unsavePostAndChallenge,
  getSavedItems,
} from "../controllers/save.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/save").post(verifyJWT, savePostAndChallenge);

router.route("/unsave").delete(verifyJWT, unsavePostAndChallenge);

router.route("/saved-items").get(verifyJWT, getSavedItems);

export default router;
