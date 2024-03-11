import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!channelId) {
        throw new ApiError(400, "channel ID is missing");
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if user is trying to subscribe to their own channel
    if (String(channelId) === String(req.user?._id)) {
        throw new ApiError(400, "User cannot subscribe to their own channel");
    }

    const existingSubscription = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user?._id,
    });

    if (existingSubscription) {
        return res
            .status(201)
            .json(new ApiResponse(201, true, "Unsubscribed successfully"));
    } else {
        // Subscribe user to the channel
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id,
        });

        if (!newSubscription) {
            throw new ApiError(500, "Failed to subscribe");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, true, "Subscribed successfully"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!channelId) {
        throw new ApiError(400, "channel ID is missing");
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const options = {
        page: 1,
        limit: 10,
    };

    const aggregatePipeline = Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber",
                },
            },
        },
        {
            $project: {
                _id: "$subscriber._id",
                fullname: "$subscriber.fullname",
                username: "$subscriber.username",
                avatar: "$subscriber.avatar",
            },
        },
    ]);

    Subscription.aggregatePaginate(aggregatePipeline, options)
        .then((results) => {
            res.status(200).json(
                new ApiResponse(
                    200,
                    results,
                    "Successfully fetched the list of channel subscribers."
                )
            );
        })
        .catch((err) => {
            throw new ApiError(
                500,
                err?.message || "Failed to get user channel subscribers"
            );
        });
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriberId
    if (!subscriberId) {
        throw new ApiError(400, "subscriber ID is missing");
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const options = {
        page: 1,
        limit: 10,
    };

    const aggregatePipeline = Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel",
                },
            },
        },
        {
            $project: {
                _id: "$channel._id",
                fullname: "$channel.fullname",
                username: "$channel.username",
                avatar: "$channel.avatar",
            },
        },
    ]);

    Subscription.aggregatePaginate(aggregatePipeline, options)
        .then((results) => {
            res.status(200).json(
                new ApiResponse(
                    200,
                    results,
                    "Successfully fetched the list of user subscribed channels"
                )
            );
        })
        .catch((err) => {
            throw new ApiError(
                500,
                err?.message ||
                    "Failed to get channels to which user is subscribed"
            );
        });
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
