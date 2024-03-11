import { spawnSync } from "child_process";
import { join } from "path";
import { isMainThread, parentPort, workerData } from "worker_threads";

const ytdlpPath = join(process.cwd(), "/bin/yt-dlp");

export default async function extractRawInfoFrom(
  url: string,
): Promise<RawPlayable | RawPlaylist> {
  const response = spawnSync(
    ytdlpPath,
    [url, "-J", "-I", ":10", "--no-warnings"],
    { maxBuffer: 1024 * 1024 * 10 },
  );

  if (String(response.stderr)) {
    throw new Error(String(response.stderr));
  }

  return JSON.parse(String(response.stdout));
}

if (!isMainThread) {
  (async () => parentPort?.postMessage(await extractRawInfoFrom(workerData)))();
}

export interface RawPlayable {
  _type: "video";
  age_limit?: number;
  channel?: string | null;
  channel_id?: string | null;
  channel_url?: string | null;
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

export interface RawPlaylist {
  _type: "playlist";
  description?: string;
  entries: RawPlayable[] | RawPlaylist[];
  id: string;
  thumbnails?: thumbnails;
  title?: string;
  webpage_url: string;
  webpage_url_domain: string;
}

export type thumbnails = { id: string; url: string }[];
