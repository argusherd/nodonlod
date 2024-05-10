import Playlist from "@/database/models/playlist";
import RawInfoConverter from "@/src/raw-info-converter";
import { createRawPlaylist } from "../../setup/create-raw-info";

describe("The toPlaylist method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("convert a raw-playlist into a playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    await converter.toPlaylist(rawPlaylist);

    expect(await Playlist.count()).toEqual(1);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual(rawPlaylist.title);
    expect(playlist?.url).toEqual(rawPlaylist.webpage_url);
    expect(playlist?.resourceId).toEqual(rawPlaylist.id);
    expect(playlist?.domain).toEqual(rawPlaylist.webpage_url_domain);
    expect(playlist?.thumbnail).toEqual(rawPlaylist.thumbnails?.at(0)?.url);
    expect(playlist?.description).toEqual(rawPlaylist.description);
  });

  it("does not create two identical playlists when converting the raw-playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    await converter.toPlaylist(rawPlaylist);
    await converter.toPlaylist(rawPlaylist);

    expect(await Playlist.count()).toEqual(1);
  });
});
