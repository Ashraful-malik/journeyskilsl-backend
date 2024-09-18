import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Badge name (e.g., "3-day Streak")
  imageUrl: { type: String, required: true }, // URL of the badge image
  description: { type: String }, // Optional description of the badge
  streakDaysRequired: { type: Number, required: true }, // Number of streak days needed to earn the badge
});

export const Badge = mongoose.model("Badge", badgeSchema);
