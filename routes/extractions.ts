import dayjs from "dayjs";
import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import Playable, {
  PlayableCreationAttributes,
} from "../database/models/playable";
import Playlist from "../database/models/playlist";
import { RawPlayable, RawPlaylist } from "../src/raw-info-extractor";

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

router.post("/", body("url").notEmpty(), async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.sendStatus(422);
    return;
  }

  await Extraction.create({ url: req.body.url });

  res.set("HX-Location", "/extractions").sendStatus(201);
});

router.get("/:extraction", async (req: ExtractionRequest, res) => {
  const extraction = req.extraction;

  res.render("extractions/show", { extraction });
});

router.post(
  "/:extraction/to-playable/:rawPlayableID?",
  async (req: ExtractionRequest, res) => {
    const rawInfo = req.extraction.content;

    const rawPlayable =
      rawInfo?._type === "playlist"
        ? getRawPlayable(rawInfo, String(req.params.rawPlayableID))
        : rawInfo;

    if (!rawInfo || !rawPlayable) {
      res.sendStatus(404);
      return;
    }

    await createPlayable(rawPlayable, req.body);

    res.sendStatus(201);
  },
);

router.post("/:extraction/to-playlist", async (req: ExtractionRequest, res) => {
  const rawPlaylist = req.extraction.content;

  if (!rawPlaylist || rawPlaylist._type !== "playlist") {
    res.sendStatus(404);
    return;
  }

  const { title, thumbnail, description } = req.body;

  await Playlist.create({
    title: title || rawPlaylist.title || rawPlaylist.id,
    url: rawPlaylist.webpage_url,
    thumbnail: thumbnail ?? rawPlaylist.thumbnails?.at(0)?.url,
    description: description ?? rawPlaylist.description,
  });

  res.sendStatus(201);
});

function getRawPlayable(
  rawPlaylist: RawPlaylist,
  id: string,
): RawPlayable | undefined {
  if (rawPlaylist.entries[0]?._type === "video") {
    return (rawPlaylist.entries as RawPlayable[]).find(
      (rawPlayable) => rawPlayable.id === id,
    );
  }

  for (const nestedRawPlaylist of rawPlaylist.entries as RawPlaylist[]) {
    const rawPlayable = getRawPlayable(nestedRawPlaylist, id);

    if (rawPlayable) return rawPlayable;
  }

  return undefined;
}

async function createPlayable(
  rawPlayable: RawPlayable,
  {
    title,
    description,
    thumbnail,
    ageLimit,
  }: Partial<PlayableCreationAttributes>,
) {
  await Playable.create({
    url: rawPlayable.webpage_url,
    resourceId: rawPlayable.id,
    domain: rawPlayable.webpage_url_domain,
    title: title ?? rawPlayable.title,
    duration: rawPlayable.duration,
    description: description ?? rawPlayable.description,
    thumbnail: thumbnail ?? rawPlayable.thumbnail,
    ageLimit: ageLimit ?? rawPlayable.age_limit,
    uploadDate: rawPlayable.upload_date
      ? dayjs(rawPlayable.upload_date).toDate()
      : undefined,
  });
}

export default router;
