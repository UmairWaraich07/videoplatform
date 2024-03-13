import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // Get total views of videso uploaded by the user
    const totalVideoViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
            },
        },
    ]);

    // Get total subscribers of user's channel
    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 },
            },
        },
    ]);

    const videosListUploadedByUser = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
        },

        {
            $project: {
                _id: 0,
                video: "$_id",
            },
        },
    ]);

    // Get total Likes of videos uploaded by the user
    const totalLikes = await Like.aggregate([
        {
            $match: {
                $or: videosListUploadedByUser,
            },
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 },
            },
        },
    ]);

    // Check if total views and total subscribers were retrieved successfully
    if (!totalVideoViews || !totalSubscribers || !totalLikes) {
        throw new ApiError(500, "Failed to fetch channel stats");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalViews: totalVideoViews[0]?.totalViews || 0,
                totalSubscribers: totalSubscribers[0]?.totalSubscribers || 0,
                totalLikes: totalLikes[0]?.totalLikes || 0,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const options = {
        page: 1,
        limit: 10,
    };

    const aggregationPipeline = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                totalLikes: { $size: "$likes" },
            },
        },
        {
            $project: {
                likes: 0,
            },
        },
    ]);

    Video.aggregatePaginate(aggregationPipeline, options)
        .then((results) => {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, results, "Videos fetched successfully")
                );
        })
        .catch((err) => {
            throw new ApiError(
                500,
                err?.message ||
                    "Failed to fetch the videos uploaded by that user"
            );
        });
});

export { getChannelStats, getChannelVideos };
