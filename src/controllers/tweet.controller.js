import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    // Extract content from request body
    const { content } = req.body;

    // Validate content
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet Content cannot be empty");
    }
    // Create tweet
    const tweet = await Tweet.create({
        owner: req.user?._id,
        content,
    });

    // Check if tweet was created successfully
    if (!tweet) {
        throw new ApiError(500, "Failed to create the tweet");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const options = {
        page: 1,
        limit: 10,
    };

    const aggregatePipeline = Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
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
    ]);

    // Fetch user tweets
    Tweet.aggregatePaginate(aggregatePipeline, options)
        .then(function (results) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        results,
                        "User tweets fetched successfully"
                    )
                );
        })
        .catch(function (err) {
            throw new ApiError(
                500,
                err?.message || "Failed to fetch the user tweets"
            );
        });
});

const updateTweet = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { content } = req.body;

    // Validate userId
    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    // Validate content
    if (!content) {
        throw new ApiError(400, "Content is missing");
    }

    // Update the tweet
    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            owner: userId,
        },
        {
            $set: { content: content },
        },
        {
            new: true, // Return the updated document
        }
    );
    // Check if the tweet was updated successfully
    if (!updatedTweet) {
        throw new ApiError(404, "Failed to update the user tweet");
    }

    // Return success response
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "User tweet updated successfully"
            )
        );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // Validate userId
    if (!tweetId) {
        throw new ApiError(400, "User ID is missing");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    // Check if tweet was deleted successfully
    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, true, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
