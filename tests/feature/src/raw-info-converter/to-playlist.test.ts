import Playlist from "@/database/models/playlist";
import RawInfoConverter from "@/src/raw-info-converter";
import { createPlaylist } from "../../setup/create-playable";
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

  it("does not create a playlist with empty title when converting the raw-playlist", async () => {
    const rawPlaylist = createRawPlaylist({ title: "" });

    await converter.toPlaylist(rawPlaylist);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual(rawPlaylist.id);
  });

  it("does not create two identical playlists when converting the raw-playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    await converter.toPlaylist(rawPlaylist);
    await converter.toPlaylist(rawPlaylist);

    expect(await Playlist.count()).toEqual(1);
  });

  it("can overwrite some properties when converting the raw-playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    await converter.toPlaylist(rawPlaylist, {
      title: "New title",
      thumbnail: "https://foo.com/bar.jpg",
      description: "New description",
    });

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual("New title");
    expect(playlist?.thumbnail).toEqual("https://foo.com/bar.jpg");
    expect(playlist?.description).toEqual("New description");
  });

  it("can overwrite some properties but title with empty values when converting the raw-playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    await converter.toPlaylist(rawPlaylist, {
      title: "",
      thumbnail: "",
      description: "",
    });

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual(rawPlaylist.title);
    expect(playlist?.thumbnail).toEqual("");
    expect(playlist?.description).toEqual("");
  });

  it("can overwrite some properties even if the playlist already existed when converting the raw-playlist", async () => {
    const playlist = await createPlaylist({ url: "https://foo.com/bar" });
    const rawPlaylist = createRawPlaylist({ webpage_url: playlist.url });

    await converter.toPlaylist(rawPlaylist, {
      title: "New title",
      thumbnail: "https://foo.com/bar.jpg",
      description: "New description",
    });

    await playlist.reload();

    expect(playlist?.title).toEqual("New title");
    expect(playlist?.thumbnail).toEqual("https://foo.com/bar.jpg");
    expect(playlist?.description).toEqual("New description");
  });
});
