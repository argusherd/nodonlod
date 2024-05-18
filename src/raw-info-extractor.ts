import { spawnSync } from "child_process";
import { statSync } from "fs";
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

export default async function extractRawInfoFrom({
  url,
  startAt = 1,
  stopAt = 10,
}: {
  url: string;
  startAt: number;
  stopAt: number;
}): Promise<RawPlayable | RawPlaylist> {
  const urlStat = statSync(url, { throwIfNoEntry: false });
  const extension = extname(url);
  const fileUrl = url;

  if (urlStat && urlStat.isFile()) url = `file:///${url}`.replace(/\\/g, "/");

  const response = spawnSync(ytdlpPath, ytdlpParams(url, startAt, stopAt), {
    maxBuffer: 1024 * 1024 * 10,
  });

  if (String(response.stderr)) {
    throw new Error(String(response.stderr));
  }

  const rawInfo: RawPlayable | RawPlaylist = JSON.parse(
    String(response.stdout),
  );

  if (urlStat && rawInfo._type === "video")
    updateFileRawPlayable(rawInfo, extension, fileUrl);

  return rawInfo;
}

if (!isMainThread) {
  (async () => parentPort?.postMessage(await extractRawInfoFrom(workerData)))();
}

function updateFileRawPlayable(
  rawPlayable: RawPlayable,
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

  rawPlayable.id += extension;
  rawPlayable.title =
    rawPlayable.title.split("/").pop()?.replace(extension, "") ||
    rawPlayable.title;
  rawPlayable.duration = Number(ffprobeOutput.format.duration);
  rawPlayable.webpage_url_domain = "file";
}

export interface RawPlayable {
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

export interface SubRawPlayable extends Omit<RawPlayable, "_type"> {}

export interface RawPlaylist {
  _type: "playlist";
  description?: string;
  entries: SubRawPlayable[] | RawPlaylist[];
  id: string;
  requested_entries?: number[];
  thumbnails?: thumbnails;
  title?: string;
  webpage_url: string;
  webpage_url_domain: string;
}

export type thumbnails = { id: string; url: string }[];
