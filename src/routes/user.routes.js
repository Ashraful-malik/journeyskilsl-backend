import { Router } from "express";
import {
  changeCurrentEmail,
  changeCurrentPassword,
  getUserDate,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateCoverImage,
  updateUserProfileImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// comment routes
const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-profile").post(verifyJWT, updateAccountDetails);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/change-email-address").post(verifyJWT, changeCurrentEmail);
router.route("/get-user-data").get(verifyJWT, getUserDate);

router
  .route("/update-profile-image")
  .post(verifyJWT, upload.single("profileImage"), updateUserProfileImage);

router
  .route("/update-cover-image")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImage);

//verification code routes
import { requestNewVerificationCode } from "../controllers/requestNewVerificationCode.controller.js";
import { verificationLimiter } from "../middlewares/rateLimit.middleware.js";
import { verifyEmail } from "../controllers/emailVerification.js";

router
  .route("/send-verification-code")
  .post(verificationLimiter, requestNewVerificationCode);

//email verification
router.route("/verify-email").post(verifyEmail);
export default router;
