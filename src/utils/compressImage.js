import sharp from "sharp";
import { ApiError } from "../utils/apiError.js";
import fs from "fs";

const compressImage = async (imagePath, outputFilePath) => {
  try {
    await sharp(imagePath).webp({ quality: 80 }).toFile(outputFilePath);
    return outputFilePath;
  } catch (error) {
    fs.unlinkSync(outputFilePath);
    throw new ApiError(500, error.message, "error while compressing image");
  }
};

export { compressImage };

// we can use this code to compress image
// const outputFilePath = `./public/temp/compressed_${req.file.filename}`;
