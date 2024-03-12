import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, videoId } = req.body;

    if (!name) {
        throw new ApiError(
            404,
            "Playlist name is required to create a playlist"
        );
    }

    if (!videoId) {
        throw new ApiError(404, "Video is required to create a playlist");
    }

    // Create a new playlist
    const playlist = await Playlist.create({
        name,
        description: description ? description : "",
        videos: [videoId],
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "Failed to create a playlist");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
        throw new ApiError(404, "User ID is missing");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    // Find user playlists
    const playlists = await Playlist.find({
        owner: userId,
    });

    if (!playlists) {
        throw new ApiError(500, "Failed to find playlist created by that user");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "Playlists fetched successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!playlistId) {
        throw new ApiError(404, "Playlist ID is missing");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // Find the playlist by ID and populate the videos field
    const playlist = await Playlist.findById(playlistId).populate("videos");

    // Check if the playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate the playlist and video ID
    if (!playlistId || !videoId) {
        throw new ApiError(404, "Playlist ID or video ID is missing");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId, // push the video ID to the videos array
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to add video to the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Video added to the playlist")
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate the playlist and video ID
    if (!playlistId || !videoId) {
        throw new ApiError(404, "Playlist ID or video ID is missing");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId, // remove the videoId from videos array
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to remove video from the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed from the playlist"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlist ID
    if (!playlistId) {
        throw new ApiError(404, "Playlist ID is missing");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        // Check if the playlist with the given ID exists
        const existingPlaylist = await Playlist.findById(playlistId);
        if (!existingPlaylist) {
            throw new ApiError(404, "Playlist not found");
        } else {
            throw new ApiError(500, "Failed to delete the playlist");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, true, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate playlist ID
    if (!playlistId) {
        throw new ApiError(404, "Playlist ID is missing");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // Validate name and description
    if (!name || !description) {
        throw new ApiError(404, "Playlist name or description is missing");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(400, "Failed to updated the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successuflly"
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
