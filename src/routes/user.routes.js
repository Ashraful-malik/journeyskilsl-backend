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

// like routes link
import { getAllLikes, toggleLike } from "../controllers/like.controller.js";

// comment routes
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

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

export default router;
