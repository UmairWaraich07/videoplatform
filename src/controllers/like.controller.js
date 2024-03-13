import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOneAndDelete({
        $and: [{ video: videoId }, { likedBy: req.user?._id }],
    });

    if (existingLike) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, true, "Video like removed successfully")
            );
    } else {
        // Like the video
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });

        if (!newLike) {
            throw new ApiError(500, "Failed to like the video");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, true, "Video liked successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Validate tweet ID
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const existingLike = await Like.findOneAndDelete({
        $and: [{ comment: commentId }, { likedBy: req.user?._id }],
    });

    if (existingLike) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, true, "Comment like removed successfully")
            );
    } else {
        // Like the comment
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id,
        });

        if (!newLike) {
            throw new ApiError(500, "Failed to like the comment");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, true, "Comment liked successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // Validate tweet ID
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOneAndDelete({
        $and: [{ tweet: tweetId }, { likedBy: req.user?._id }],
    });

    if (existingLike) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, true, "Tweet like removed successfully")
            );
    } else {
        // Like the tweet
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id,
        });

        if (!newLike) {
            throw new ApiError(500, "Failed to like the tweet");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, true, "Tweet liked successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user?._id,
    }).populate("video");

    if (!likedVideos) {
        throw new ApiError(500, "Failed to fetch the liked videos");
    }

    // Extract only the video information from each liked video object
    const videoInfoArray = likedVideos.map((likedVideo) => likedVideo.video);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoInfoArray,
                "Liked videos fetched successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
