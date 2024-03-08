import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded on cloudinary", response.url);
        // once the file uploaded  successfully delete local copy of the file
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new ApiError(
                400,
                "PublicId is required to delete file from cloudinary"
            );
        }
        const response = await cloudinary.uploader.destroy(publicId);

        console.log("File deleted from cloudinary", response);

        return response;
    } catch (error) {
        console.log(`Failed to delete file from cloudinary: ${error}`);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
