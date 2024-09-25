import { Router } from "express";
import { getSavedItems, toggleSave } from "../controllers/save.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/save").post(verifyJWT, toggleSave);
router.route("/saved-items").get(verifyJWT, getSavedItems);

export default router;
