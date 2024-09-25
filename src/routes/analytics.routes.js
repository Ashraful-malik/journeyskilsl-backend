import { Router } from "express";

import { userChallengeAnalytics } from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/challenge-analytics/:id").get(verifyJWT, userChallengeAnalytics);

export default router;
