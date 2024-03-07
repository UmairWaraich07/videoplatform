import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave: false,
        });

        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens!"
        );
    }
};

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

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(404, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user)
        throw new ApiError(
            403,
            "User with this username or email does not exists"
        );

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) throw new ApiError(403, "Wrong Password!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //set the cookies in the client'
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user;
    await User.findByIdAndUpdate(
        user._id,
        {
            $set: { refreshToken: undefined },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Invalid refresh token");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", options)
        .cookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                },
                "Access token refreshed"
            )
        );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
