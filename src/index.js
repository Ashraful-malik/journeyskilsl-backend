import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port : ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error:", error);
      throw error;
    });
  })
  .catch((error) => {
    console.log("mongo db connectin failed !! ", error);
  });
