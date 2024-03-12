import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-playlist").post(createPlaylist);
router.route("/:userId").get(getUserPlaylists);
router.route("/user/:playlistId").get(getPlaylistById);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/:playlistId/update").patch(updatePlaylist);
router.route("/:playlistId/delete").delete(deletePlaylist);

export default router;
