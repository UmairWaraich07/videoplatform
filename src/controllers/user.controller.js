import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body;

    if (
        [fullname, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const avatarLocalPath = req.files?.avatar && req.files?.avatar[0]?.path;
    const coverImageLocalPath =
        req.files?.coverImage && req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists!"
        );
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar)
        throw new ApiError(400, "Failed to upload image on Cloudinary!");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const createdUser = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
    });

    const response = await User.findById(createdUser._id).select(
        "-password -refreshToken"
    );

    if (!response) throw new ApiError(500, "Failed to register the User");

    return res
        .status(201)
        .json(new ApiResponse(200, response, "User registered successfully!"));
});

export { registerUser };
