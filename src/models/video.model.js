import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            required: true,
            index: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        thumbnail: {
            url: {
                type: String, // cloudinary URL
                required: true,
            },
            public_id: {
                type: String, // cloudinary public_id
                required: true,
            },
        },
        videoFile: {
            url: {
                type: String, // cloudinary URL
                required: true,
            },
            public_id: {
                type: String, // cloudinary public_id
                required: true,
            },
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
