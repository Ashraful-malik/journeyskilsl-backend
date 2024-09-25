import { Badge } from "../models/badge.model.js";

const badges = [
  {
    streak: 3,
    massage: "You're off to a great start! Keep going and build the momentum.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/y5pq3tm4ka9yictuhu0n",
  },
  {
    streak: 7,
    massage: "Awesome! One week down, and you're creating a powerful habit.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/rsb7hxy2sfz63a9q4e0j",
  },
  {
    streak: 14,
    massage: "Two weeks of consistency! You're on the path to success.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/xxlomjytw5h6moarmhqa",
  },
  {
    streak: 21,
    massage: "Three weeks strong! This habit is becoming second nature.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/go9onsj0rxklb9zuhgqf",
  },
  {
    streak: 30,
    massage: "One month of dedication! You've built something incredible.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/zdba9bqgaxkduvorat46",
  },
  {
    streak: 60,
    massage: "Two months in! Your commitment is paying off big time.",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/vmeudfu0dagnvf5ncnje",
  },
  {
    streak: 90,
    massage: "Three months of relentless focus! You're an inspiration!",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/hflrb5wpdbfcsgigscoo",
  },
  {
    name: "Launch Badge",
    massage:
      "Thank you for believing in us and joining us early on this journey. We're honored to have you as part of our community!",
    image:
      "https://res.cloudinary.com/dxe3cn4ca/image/upload/f_auto,q_auto/v1/badges/abrrexghifquq90jynld",
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
