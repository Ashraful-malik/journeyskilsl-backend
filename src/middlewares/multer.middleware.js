import multer from "multer";
import { IMAGE_FILE_SIZE_LIMIT } from "../constants.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, file.originalname + "-" + uniqueSuffix);
  },
  limits: { fileSize: IMAGE_FILE_SIZE_LIMIT },
});

export const upload = multer({ storage: storage });
