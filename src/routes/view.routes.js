import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getViewCount,
  handleViewEvent,
} from "../controllers/views.controller.js";

const router = Router();

router.route("/views/:contentType/:id").post(verifyJWT, handleViewEvent);
router.route("/views/:contentType/:id").get(verifyJWT, getViewCount);

export default router;
