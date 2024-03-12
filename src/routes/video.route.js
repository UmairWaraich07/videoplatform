import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/publish-video").post(
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1,
        },
        {
            name: "videoFile",
            maxCount: 1,
        },
    ]),
    publishAVideo
);

router.route("/").get(getAllVideos);

router.route("/:videoId").get(getVideoById);

router.route("/:videoId/update").patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/:videoId").post(togglePublishStatus);

router.route("/:videoId/delete").delete(deleteVideo);

export default router;
