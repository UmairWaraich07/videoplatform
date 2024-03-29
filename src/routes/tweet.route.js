import { Router } from "express";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-tweet").post(createTweet);
router.route("/:userId").get(getUserTweets);
router.route("/:userId/update").patch(updateTweet);
router.route("/:tweetId/delete").delete(deleteTweet);

export default router;
