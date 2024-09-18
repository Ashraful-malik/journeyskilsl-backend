import { Badge } from "../models/badge.model.js";

const badges = [
  {
    streak: 3,
    message: "You're off to a great start! Keep going and build the momentum.",
  },
  {
    streak: 7,
    message: "Awesome! One week down, and you're creating a powerful habit.",
  },
  {
    streak: 14,
    message: "Two weeks of consistency! You're on the path to success.",
  },
  {
    streak: 21,
    message: "Three weeks strong! This habit is becoming second nature.",
  },
  {
    streak: 30,
    message: "One month of dedication! You've built something incredible.",
  },
  {
    streak: 60,
    message: "Two months in! Your commitment is paying off big time.",
  },
  {
    streak: 90,
    message: "Three months of relentless focus! You're an inspiration!",
  },
  {
    name: "Launch Badge",
    message:
      "Thank you for believing in us and joining us early on this journey. We're honored to have you as part of our community!",
    image: "https://i.ibb.co/5bKJn5B/1.png",
  },
];

const seedBadge = async () => {
  try {
    badges.forEach(async (badges) => {
      const existingBadge = await Badge.findOne({ streak: badges.streak });
      if (!existingBadge) {
        await Badge.create(badges);
      }
      console.log("Badge created successfully");
    });
  } catch (error) {
    console.log(error);
  }
};

export default seedBadge;
