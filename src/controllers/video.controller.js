import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    deleteVideoFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

// ✅✅
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid User ID");
        }
    }
    // Construct match stage for filtering
    const match = query
        ? {
              $match: {
                  $or: [
                      { title: { $regex: query, $options: "i" } },
                      { description: { $regex: query, $options: "i" } },
                  ],
              },
          }
        : {
              $match: {},
          };

    // If userId is provided, add match condition for owner
    if (userId) {
        match.$match.owner = new mongoose.Types.ObjectId(userId);
    }

    // Construct sort stage for sorting
    const sort =
        sortBy && sortType
            ? { $sort: { [sortBy]: sortType === "desc" ? -1 : 1 } }
            : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const aggregatePipeline = Video.aggregate([
        match,
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
        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },
            },
        },
    ]);

    // Add sort stage if it's not an empty object
    if (Object.keys(sort).length !== 0) {
        aggregatePipeline.splice(1, 0, sort);
    }

    Video.aggregatePaginate(aggregatePipeline, options)
        .then(function (results) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, results, "Videos fetched successfully")
                );
        })
        .catch(function (err) {
            throw new ApiError(
                500,
                err?.message || "Failed to fetch the videos"
            );
        });
});

// ✅✅
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(404, "Title or description is missing");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoLocalPath = req.files?.videoFile[0]?.path;

    if (!thumbnailLocalPath || !videoLocalPath) {
        throw new ApiError(404, "Thumbnail or video is missing");
    }

    // upload the file to the cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
        throw new ApiError(500, "Failed to upload thumbnail on cloudinary");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    if (!video.url) {
        throw new ApiError(500, "Failed to upload video on cloudinary");
    }

    const newVideo = await Video.create({
        title,
        description,
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id,
        },
        videoFile: {
            url: video.url,
            public_id: video.public_id,
        },
        duration: video.duration,
        owner: req.user?._id,
    });

    if (!newVideo) {
        throw new ApiError(500, "Failed to upload the video");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newVideo, "Video uploaded successfully"));
});

// ✅✅
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        },
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers",
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },
            },
        },
    ]);

    if (!video) {
        throw new ApiError(500, "Failed to fetch the video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

// ✅✅
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;
    const thumbnailLocalPath = req.file?.path; // multer  will save it here when we upload a file
    const isThumbnailEdited = thumbnailLocalPath ? true : false;

    if (!thumbnailLocalPath && !thumbnail) {
        throw new ApiError(400, "Thumbnail is missing");
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "Video ID is missing");
    }
    if (!title || !description) {
        throw new ApiError(400, "Title or description is missing");
    }

    // only upload the upload to cloudinary if user uploaded a new
    let newThumbnail;
    if (isThumbnailEdited) {
        newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }

    // Fetch old thumbnail public Id
    let oldThumbnailPublicId;
    if (isThumbnailEdited) {
        oldThumbnailPublicId = (
            await Video.findById(videoId).select(["thumbnail"])
        ).thumbnail.public_id;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: isThumbnailEdited
                    ? {
                          url: newThumbnail.url,
                          public_id: newThumbnail.public_id,
                      }
                    : thumbnail,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update the video");
    }

    // delete the already uploaded thumbnail from cloudinary only if user uploaded the new thumbnail
    if (isThumbnailEdited) {
        const response = await deleteFromCloudinary(oldThumbnailPublicId);

        if (!response) {
            throw new ApiError(
                500,
                "Failed to delete already uploaded thumbnail from cloudinary"
            );
        }
    }

    return res
        .status(201)
        .json(new ApiResponse(201, updatedVideo, "Video updated successfully"));
});

// TODO: write the deleteVideo after writting all other controllers
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const response = await Video.findByIdAndDelete(videoId);
    if (!response) {
        throw new ApiError(500, "Failed to delete this video");
    }

    // after deletion of videoFile delete the thumbnail and videoFile from cloudinary
    const thumbnailPublicId = response.thumbnail.public_id;
    const videoFilePublicId = response.videoFile.public_id;

    const isThumbnailDeleted = await deleteFromCloudinary(thumbnailPublicId);
    if (!isThumbnailDeleted) {
        throw new ApiError(500, "Failed to delete thumbnail from cloudinary");
    }

    const isVideoDeleted = await deleteVideoFromCloudinary(videoFilePublicId);
    if (!isVideoDeleted) {
        throw new ApiError(500, "Failed to delete video from cloudinary");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// ✅✅
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const newPublishedStatus = !video.isPublished;

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: newPublishedStatus,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to toggle publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Publish status toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
