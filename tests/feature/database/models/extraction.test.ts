import Extraction from "@/database/models/extraction";
import { RawPlaylist } from "@/src/raw-info-extractor";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../setup/create-raw-info";

describe("The extraction model", () => {
  it("can persist one record to the database", async () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const extraction = await Extraction.create({ url });

    expect(extraction.url).toEqual(url);
    expect(await Extraction.count()).toEqual(1);
  });

  it("casts the content string to a RawPlayable or RawPlaylist", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist();

    const withRawPlayable = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: JSON.stringify(rawPlayable),
    });

    const withRawPlaylist = await Extraction.create({
      url: "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
      content: JSON.stringify(rawPlaylist),
    });

    expect(withRawPlayable.content).toEqual(rawPlayable);
    expect(withRawPlaylist.content).toEqual(rawPlaylist);
  });

  it("should flatten the nested raw-playlists when retrieving the content property", async () => {
    const rawPlayable = createRawPlayable();

    const doubleNestedRawPlaylist = createRawPlaylist({
      entries: [rawPlayable],
    });
    const nestedRawPlaylist = createRawPlaylist({
      entries: [doubleNestedRawPlaylist],
    });
    const rawPlaylist = createRawPlaylist({
      entries: [nestedRawPlaylist],
    });

    const extraction = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: JSON.stringify(rawPlaylist),
    });

    const parsedContent = extraction.content as RawPlaylist;

    expect(parsedContent.entries[0]?._type).toEqual("video");
    expect(parsedContent.entries[0]?.id).toEqual(rawPlayable.id);
  });
});
