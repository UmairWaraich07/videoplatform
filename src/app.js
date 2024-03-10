import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(
    express.json({
        limit: "16kb",
    })
);
app.use(cookieParser());
app.use(express.static("public"));

// routes imports
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";

// routes declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

export { app };
