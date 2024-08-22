import { Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue, {
  PlayQueueCreationAttributes,
} from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";
import mediaPlayer from "../src/media-player";
import { HasPageRequest } from "./middlewares/pagination";
import wss from "./websocket";

interface PlaylistRequest extends HasPageRequest {
  playlist: Playlist;
}

const router = Router();

router.param("playlist", async (req: PlaylistRequest, res, next) => {
  const playlist = await Playlist.findByPk(req.params.playlist);

  if (playlist) {
    req.playlist = playlist;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: playlists, count } = await Playlist.findAndCountAll({
    limit: req.perPage,
    offset: (req.currentPage - 1) * req.perPage,
    order: [["createdAt", "DESC"]],
  });

  res.render("playlists/index", {
    playlists,
    count,
  });
});

router.get("/:playlist", async (req: PlaylistRequest, res) => {
  res.render("playlists/show.pug", {
    playlist: req.playlist,
    items: await PlaylistItem.findAll({
      where: { playlistId: req.playlist.id },
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.get("/:playlist/play", async (req: PlaylistRequest, res) => {
  const playlistItems = await PlaylistItem.findAll({
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  if (!playlistItems.length) {
    res.sendStatus(202);
    return;
  }

  const medium = (await playlistItems[0]?.$get("medium")) as Medium;
  const chapter = (await playlistItems[0]?.$get("chapter")) ?? undefined;
  const { startTime, endTime } = chapter || {};

  mediaPlayer.play(medium.url, startTime, endTime);
  wss.nowPlaying(medium, chapter);

  await queue(playlistItems);

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(202);
});

router.post("/:playlist/queue", async (req: PlaylistRequest, res) => {
  const playlistItems = await PlaylistItem.findAll({
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  await queue(playlistItems);

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:playlist", async (req: PlaylistRequest, res) => {
  await req.playlist.destroy();

  res.set("HX-Location", "/playlists").sendStatus(204);
});

async function queue(playlistItems: PlaylistItem[]) {
  const data: PlayQueueCreationAttributes[] = [];
  let order = Number(await PlayQueue.max("order")) + 1;

  for (const playlistItem of playlistItems)
    data.push({
      mediumId: playlistItem.mediumId,
      chapterId: playlistItem.chapterId,
      order: order++,
    });

  await PlayQueue.bulkCreate(data);
}

export default router;
