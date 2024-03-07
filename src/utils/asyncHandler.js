const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };

// export const asyncHandler2 = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(400).json({
//             message: "Internal Server Error",
//             success: false,
//         });
//     }
// };
