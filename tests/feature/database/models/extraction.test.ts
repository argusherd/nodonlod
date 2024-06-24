import Extraction from "@/database/models/extraction";
import {
  createRawMedium,
  createRawPlaylist,
} from "../../setup/create-raw-info";

describe("The extraction model", () => {
  it("can persist one record to the database", async () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const extraction = await Extraction.create({ url });

    expect(extraction.url).toEqual(url);
    expect(await Extraction.count()).toEqual(1);
  });

  it("casts the content string to a RawMedium or RawPlaylist", async () => {
    const rawMedium = createRawMedium();
    const rawPlaylist = createRawPlaylist();

    const withRawMedium = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: JSON.stringify(rawMedium),
    });

    const withRawPlaylist = await Extraction.create({
      url: "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
      content: JSON.stringify(rawPlaylist),
    });

    expect(withRawMedium.content).toEqual(rawMedium);
    expect(withRawPlaylist.content).toEqual(rawPlaylist);
  });
});
