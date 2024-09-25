import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  image: { type: String, required: true }, // URL of the badge image
  massage: { type: String }, // Optional description of the badge
  streak: { type: Number }, // Number of streak days needed to earn the badge
});

export const Badge = mongoose.model("Badge", badgeSchema);
