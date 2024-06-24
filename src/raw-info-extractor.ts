import { spawnSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { extname, join } from "path";
import { isMainThread, parentPort, workerData } from "worker_threads";

const ytdlpPath = join(process.cwd(), "/bin/yt-dlp");
const ytdlpParams = (url: string, startAt: number, stopAt: number) => [
  url,
  "-J",
  "-I",
  `${startAt}:${stopAt}`,
  "--no-warnings",
  "--enable-file-urls",
];
const ffprobePath = join(process.cwd(), "/bin/ffprobe");
const extensions = [
  "avi",
  "flv",
  "mp3",
  "mp4",
  "mpv",
  "ogg",
  "wav",
  "webm",
  "wmv",
];

export default function extractRawInfoFrom({
  url,
  startAt = 1,
  stopAt = 10,
}: {
  url: string;
  startAt: number;
  stopAt: number;
}): RawMedium | RawPlaylist {
  const urlStat = statSync(url, { throwIfNoEntry: false });
  const extension = extname(url);
  const fileUrl = url;

  if (urlStat) url = url.replace(/\\/g, "/");
  if (urlStat?.isFile()) url = `file:///${url}`;
  if (urlStat?.isDirectory()) return getRawPlaylistFromDir(url);

  const response = spawnSync(ytdlpPath, ytdlpParams(url, startAt, stopAt), {
    maxBuffer: 1024 * 1024 * 10,
  });

  if (String(response.stderr)) {
    throw new Error(String(response.stderr));
  }

  const rawInfo: RawMedium | RawPlaylist = JSON.parse(String(response.stdout));

  if (urlStat && rawInfo._type === "video")
    updateFileRawMedium(rawInfo, extension, fileUrl);

  return rawInfo;
}

if (!isMainThread) {
  (async () => parentPort?.postMessage(extractRawInfoFrom(workerData)))();
}

function getRawPlaylistFromDir(dir: string) {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter(
      (dirent) =>
        !dirent.isDirectory() &&
        extensions.includes(extname(dirent.name).replace(".", "")),
    )
    .map((dirent) => {
      const { _type, ...subRawPlayble } = extractRawInfoFrom({
        url: join(dir, dirent.name),
        startAt: 1,
        stopAt: 1,
      });

      return subRawPlayble as SubRawMedium;
    });

  const rawPlaylist: RawPlaylist = {
    _type: "playlist",
    entries,
    id: dir,
    webpage_url: dir,
    webpage_url_domain: "file",
  };

  return rawPlaylist;
}

function updateFileRawMedium(
  rawMedium: RawMedium,
  extension: string,
  ffprobeInput: string,
) {
  const response = spawnSync(ffprobePath, [
    ffprobeInput,
    "-output_format",
    "json",
    "-show_format",
  ]);

  if (response.status != 0) {
    throw new Error(String(response.stderr));
  }

  const ffprobeOutput = JSON.parse(String(response.stdout));

  rawMedium.id += extension;
  rawMedium.title =
    rawMedium.title.split("/").pop()?.replace(extension, "") || rawMedium.title;
  rawMedium.duration = Number(ffprobeOutput.format.duration);
  rawMedium.webpage_url_domain = "file";
}

export interface RawMedium {
  _type: "video";
  age_limit?: number;
  channel?: string | null;
  channel_id?: string | null;
  channel_url?: string | null;
  chapters?: { start_time: number; title: string; end_time: number }[];
  description?: string;
  duration: number;
  id: string;
  tags?: string[];
  thumbnail?: string | null;
  thumbnails?: thumbnails;
  title: string;
  upload_date?: string;
  uploader?: string | null;
  uploader_id?: string | null;
  uploader_url?: string | null;
  webpage_url: string;
  webpage_url_domain: string;
}

export interface SubRawMedium extends Omit<RawMedium, "_type"> {}

export interface RawPlaylist {
  _type: "playlist";
  description?: string;
  entries: SubRawMedium[] | RawPlaylist[];
  id: string;
  requested_entries?: number[];
  thumbnails?: thumbnails;
  title?: string;
  webpage_url: string;
  webpage_url_domain: string;
}

export type thumbnails = { id: string; url: string }[];
