import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const port = 5050;

const corsOptions = {
  origin: "http://localhost:5173", // Use environment variable for frontend URL
  credentials: true, // This allows cookies to be sent and received
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
 
app.use(cors(corsOptions));
app.use(express.static("./public/temp"));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

dotenv.config({
  path: "./.env",
});

// Import routers
import userrouter from "./Routes/user.routes.js";
import videoRouter from "./Routes/video.routes.js";
import likeRouter from "./Routes/like.routes.js";
import subscriptionRouter from "./Routes/subscription.routes.js";
import commentRouter from "./Routes/comment.routes.js";
import logRouter from "./Routes/log.routes.js";

// Use routers
app.use("/api/v1/users", userrouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/log",logRouter)

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log("server running at port number", port);
    });
  })
  .catch((err) => {
    console.log("mongo connection failure", err);
  });
