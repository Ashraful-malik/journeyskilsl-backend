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
import comment from "./routes/comment.routes.js";
import like from "./routes/like.routes.js";
import view from "./routes/view.routes.js";
import save from "./routes/save.routes.js";
import analytics from "./routes/analytics.routes.js";
import followFollowing from "./routes/followFollowing.routes.js";

//routes declaration
app.use("/api/v1/users", userroutes);
app.use("/api/v1/users", challenge);
app.use("/api/v1/users", post);
app.use("/api/v1/users", comment);
app.use("/api/v1/users", like);
app.use("/api/v1/users", view);
app.use("/api/v1/users", save);
app.use("/api/v1/users", analytics);
app.use("/api/v1/users", followFollowing);

export { app };
