import dayjs from "dayjs";
import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import Playable from "../database/models/playable";
import { RawPlayable, RawPlaylist } from "../src/raw-info-extractor";

interface ExtractionRequest extends Request {
  extraction?: Extraction;
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
    const rawInfo = req.extraction?.content;

    if (!rawInfo) {
      res.sendStatus(404);
      return;
    }

    const rawPlayable =
      rawInfo._type === "playlist"
        ? getRawPlayable(rawInfo, String(req.params.rawPlayableID))
        : rawInfo;

    if (!rawPlayable) {
      res.sendStatus(404);
      return;
    }

    const { title, description, thumbnail, ageLimit } = req.body;

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

    res.sendStatus(201);
  },
);

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

export default router;
