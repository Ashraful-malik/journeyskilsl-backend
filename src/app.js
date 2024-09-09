import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userroutes from "./routes/user.routes.js";
import challenge from "./routes/challenge.routes.js";
import post from "./routes/post.routes.js";

//routes declaration
app.use("/api/v1/users", userroutes);
app.use("/api/v1/users", challenge);
app.use("/api/v1/users", post);

export { app };
