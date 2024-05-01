import dayjs from "dayjs";
import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import Playable, {
  PlayableCreationAttributes,
} from "../database/models/playable";
import Playlist, {
  PlaylistCreationAttributes,
} from "../database/models/playlist";
import {
  RawPlayable,
  RawPlaylist,
  SubRawPlayable,
} from "../src/raw-info-extractor";

interface ExtractionRequest extends Request {
  extraction: Extraction;
}

const router = Router();

router.param("extraction", async (req: ExtractionRequest, res, next) => {
  const extraction = await Extraction.findByPk(req.params.extraction);

  if (extraction) {
    req.extraction = extraction;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (_req, res) => {
  res.render("extractions/index", {
    extractions: await Extraction.findAll(),
  });
});

router.post(
  "/",
  body("url").notEmpty(),
  body("page").isNumeric().optional({ values: "falsy" }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    await Extraction.create({
      url: req.body.url,
      isContinuous: Boolean(req.body.isContinuous),
      page: req.body.page || undefined,
    });

    res.set("HX-Location", "/extractions").sendStatus(201);
  },
);

router.get("/:extraction", async (req: ExtractionRequest, res) => {
  const extraction = req.extraction;

  res.render("extractions/show", { extraction });
});

router.post("/:extraction/playables", async (req: ExtractionRequest, res) => {
  const rawPlayable = findRawInfoById(
    req.extraction.content,
    req.body.resourceId,
  );

  if (
    !rawPlayable ||
    ("_type" in rawPlayable && rawPlayable._type === "playlist")
  ) {
    res.sendStatus(404);
    return;
  }

  await createPlayable(rawPlayable, req.body);

  res.sendStatus(201);
});

router.post("/:extraction/playlists", async (req: ExtractionRequest, res) => {
  const rawPlaylist = findRawInfoById(
    req.extraction.content,
    req.body.resourceId,
  );

  if (
    !rawPlaylist ||
    "_type" in rawPlaylist === false ||
    rawPlaylist._type === "video"
  ) {
    res.sendStatus(404);
    return;
  }

  await createPlaylist(rawPlaylist, req.body);

  res.sendStatus(201);
});

function findRawInfoById(
  rawInfo: RawPlayable | RawPlaylist | SubRawPlayable | null,
  id?: string,
): RawPlayable | RawPlaylist | SubRawPlayable | null {
  if (!rawInfo || !id || rawInfo.id === id) return rawInfo;

  for (const childRawInfo of "entries" in rawInfo ? rawInfo.entries : []) {
    const targetRawInfo = findRawInfoById(childRawInfo, id);

    if (targetRawInfo) return targetRawInfo;
  }

  return null;
}

async function createPlayable(
  rawPlayable: RawPlayable | SubRawPlayable,
  {
    title,
    description,
    thumbnail,
    ageLimit,
  }: Partial<PlayableCreationAttributes>,
) {
  const playable = await Playable.findOne({
    where: { url: rawPlayable.webpage_url, resourceId: rawPlayable.id },
  });

  const overwrite = {
    title: title ?? rawPlayable.title,
    duration: rawPlayable.duration,
    description: description ?? rawPlayable.description,
    thumbnail: thumbnail ?? rawPlayable.thumbnail,
    ageLimit: ageLimit ?? rawPlayable.age_limit,
  };

  if (playable) {
    await playable.update(overwrite);
    return;
  }

  await Playable.create({
    url: rawPlayable.webpage_url,
    resourceId: rawPlayable.id,
    domain: rawPlayable.webpage_url_domain,
    uploadDate: rawPlayable.upload_date
      ? dayjs(rawPlayable.upload_date).toDate()
      : undefined,
    ...overwrite,
  });
}

async function createPlaylist(
  rawPlaylist: RawPlaylist,
  { title, thumbnail, description }: Partial<PlaylistCreationAttributes>,
) {
  const playlist = await Playlist.findOne({
    where: { url: rawPlaylist.webpage_url, resourceId: rawPlaylist.id },
  });

  const overwrite = {
    title: title || rawPlaylist.title || rawPlaylist.id,
    thumbnail: thumbnail ?? rawPlaylist.thumbnails?.at(0)?.url,
    description: description ?? rawPlaylist.description,
  };

  if (playlist) {
    await playlist.update(overwrite);
    return;
  }

  await Playlist.create({
    url: rawPlaylist.webpage_url,
    resourceId: rawPlaylist.id,
    domain: rawPlaylist.webpage_url_domain,
    ...overwrite,
  });
}

export default router;
