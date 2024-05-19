import extractRawInfoFrom, {
  RawPlayable,
  RawPlaylist,
} from "@/src/raw-info-extractor";
import { existsSync } from "fs";
import { join } from "path";

describe("The raw info extractor module", () => {
  const ytdlpPath = join(process.cwd(), "/bin/yt-dlp");
  const ffprobePath = join(process.cwd(), "/bin/ffprobe");
  const dirPath = join(process.cwd(), "/tests/feature/src/raw-info-extractor");
  const samplePath = dirPath + "/sample.mp3";

  beforeAll(() => {
    expect(
      existsSync(ytdlpPath) || existsSync(`${ytdlpPath}.exe`),
    ).toBeTruthy();
    expect(
      existsSync(ffprobePath) || existsSync(`${ffprobePath}.exe`),
    ).toBeTruthy();
    expect(existsSync(samplePath)).toBeTruthy();
  });

  it("can extract information from local media files", async () => {
    const rawPlayable = (await extractRawInfoFrom({
      url: samplePath,
      startAt: 1,
      stopAt: 1,
    })) as RawPlayable;

    expect(rawPlayable._type).toEqual("video");
    expect(rawPlayable.id).toContain("sample.mp3");
    expect(rawPlayable.duration).toBeGreaterThan(0);
    expect(rawPlayable.title).toEqual("sample");
    expect(rawPlayable.webpage_url_domain).toEqual("file");
    expect(rawPlayable.upload_date).not.toBeUndefined();
  });

  it("does not yield any encoded backslashes in the raw-playable webpage_url_domain property when extracting a file", async () => {
    const rawPlayable = (await extractRawInfoFrom({
      url: samplePath,
      startAt: 1,
      stopAt: 1,
    })) as RawPlayable;

    expect(rawPlayable.webpage_url).not.toContain("%5C");
  });

  it("can extract information from local directories", () => {
    const rawPlaylist = extractRawInfoFrom({
      url: dirPath,
      startAt: 1,
      stopAt: 1,
    }) as RawPlaylist;

    expect(rawPlaylist._type).toEqual("playlist");
    expect(rawPlaylist.entries).toHaveLength(1);
    expect(rawPlaylist.entries.at(0)?.title).toEqual("sample");
    expect(rawPlaylist.id).toEqual(dirPath.replace(/\\/g, "/"));
    expect(rawPlaylist.webpage_url).toEqual(dirPath.replace(/\\/g, "/"));
    expect(rawPlaylist.webpage_url_domain).toEqual("file");
  });
});
