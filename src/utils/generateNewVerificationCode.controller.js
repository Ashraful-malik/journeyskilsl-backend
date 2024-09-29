import { Verification } from "../models/verification.model.js";
import crypto from "crypto";
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString(); // Generates a 6-digit numeric code
};
const expireVerificationCode = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000); // Expiry time
};
const generateNewVerificationCode = async (userId) => {
  try {
    await Verification.deleteMany(userId);
    const verificationCode = generateVerificationCode();
    const verificationExpires = expireVerificationCode(10);

    const newVerification = new Verification({
      userId,
      verificationCode,
      verificationExpires,
    });

    await newVerification.save();
    return verificationCode;
  } catch (error) {
    console.error(error);
  }
};

export { generateNewVerificationCode };
