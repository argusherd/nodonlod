import Playable from "@/database/models/playable";
import Playlist from "@/database/models/playlist";
import convertRawInfo from "@/electron/jobs/convert-raw-info";
import dayjs from "dayjs";
import { createPlayable, createPlaylist } from "../../setup/create-playable";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../setup/create-raw-info";

describe("The job can convert raw info to playable/playlist", () => {
  it("creates a playable based on the raw-playable content", async () => {
    const rawPlayable = createRawPlayable();

    await convertRawInfo(rawPlayable);

    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();

    expect(playable?.url).toEqual(rawPlayable.webpage_url);
    expect(playable?.resourceId).toEqual(rawPlayable.id);
    expect(playable?.domain).toEqual(rawPlayable.webpage_url_domain);
    expect(playable?.title).toEqual(rawPlayable.title);
    expect(playable?.duration).toEqual(rawPlayable.duration);
    expect(playable?.description).toEqual(rawPlayable.description);
    expect(playable?.thumbnail).toEqual(rawPlayable.thumbnail);
    expect(playable?.ageLimit).toEqual(rawPlayable.age_limit);
    expect(playable?.uploadDate).toEqual(
      dayjs(rawPlayable.upload_date).toDate(),
    );
  });

  it("creates a playlist and relatived playables based on the raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    await convertRawInfo(rawPlaylist);

    expect(await Playlist.count()).toEqual(1);
    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();
    const playlist = await Playlist.findOne();

    expect(playable?.resourceId).toEqual(rawPlayable.id);

    expect(playlist?.title).toEqual(rawPlaylist.title);
    expect(playlist?.url).toEqual(rawPlaylist.webpage_url);
    expect(playlist?.resourceId).toEqual(rawPlaylist.id);
    expect(playlist?.domain).toEqual(rawPlaylist.webpage_url_domain);
    expect(playlist?.thumbnail).toEqual(
      rawPlaylist.thumbnails && rawPlaylist.thumbnails[0]?.url,
    );
    expect(playlist?.description).toEqual(rawPlaylist.description);
  });

  it("creates multiple playlists based on the nested raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const childRawPlaylist1 = createRawPlaylist({ entries: [rawPlayable] });
    const childRawPlaylist2 = createRawPlaylist({ entries: [rawPlayable] });
    const parentRawPlaylist = createRawPlaylist({
      entries: [childRawPlaylist1, childRawPlaylist2],
    });

    await convertRawInfo(parentRawPlaylist);

    expect(await Playlist.count()).toEqual(2);
    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();
    const playlist1 = await Playlist.findOne();
    const playlist2 = await Playlist.findOne({ offset: 1 });

    expect(playable?.resourceId).toEqual(rawPlayable.id);
    expect(playlist1?.resourceId).toEqual(childRawPlaylist1.id);
    expect(playlist2?.resourceId).toEqual(childRawPlaylist2.id);
  });

  it("does not create a playlist from the top level of a nested raw-playlist", async () => {
    const rawPlayable = createRawPlayable();
    const childRawPlaylist = createRawPlaylist({ entries: [rawPlayable] });
    const parentPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    await convertRawInfo(parentPlaylist);

    const playlist = await Playlist.findOne();

    expect(await Playlist.count()).toEqual(1);
    expect(playlist?.resourceId).toEqual(childRawPlaylist.id);
  });

  it("does not create a playlist from a raw-playlist with an empty entries property", async () => {
    const nestedRawPlaylist = createRawPlaylist({ entries: [] });
    const rawPlaylist = createRawPlaylist({ entries: [nestedRawPlaylist] });

    await convertRawInfo(rawPlaylist);

    expect(await Playlist.count()).toEqual(0);
  });

  it("does not create a same playable twice", async () => {
    const rawPlayable = createRawPlayable();

    await convertRawInfo(rawPlayable);
    await convertRawInfo(rawPlayable);

    expect(await Playable.count()).toEqual(1);
  });

  it("does not create a same playlist twice", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    await convertRawInfo(rawPlaylist);
    await convertRawInfo(rawPlaylist);

    expect(await Playlist.count()).toEqual(1);
    expect(await Playable.count()).toEqual(1);
  });

  it("does not overwrite the existing playable's title, description, thumbnail, or age limit but duration", async () => {
    const rawPlayable = createRawPlayable();

    const playable = await createPlayable({
      url: rawPlayable.webpage_url,
      resourceId: rawPlayable.id,
      title: "My title",
      description: "My description",
      thumbnail: "https://my-thumbnail.com/foo.jpg",
      ageLimit: 50,
      duration: 666,
    });

    await convertRawInfo(rawPlayable);

    await playable.reload();

    expect(playable.title).toEqual("My title");
    expect(playable.description).toEqual("My description");
    expect(playable.thumbnail).toEqual("https://my-thumbnail.com/foo.jpg");
    expect(playable.ageLimit).toEqual(50);
    expect(playable.duration).toEqual(rawPlayable.duration);
  });

  it("does not overwrite the existing playlist's title, description, or thumbnail", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    const playlist = await createPlaylist({
      url: rawPlaylist.webpage_url,
      resourceId: rawPlaylist.id,
      title: "My title",
      description: "My description",
      thumbnail: "https://my-thumbnail.com/foo.jpg",
    });

    await convertRawInfo(rawPlaylist);

    await playlist.reload();

    expect(playlist.title).toEqual("My title");
    expect(playlist.description).toEqual("My description");
    expect(playlist.thumbnail).toEqual("https://my-thumbnail.com/foo.jpg");
  });

  it("should establish a relationship between the playlist and playables", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    await convertRawInfo(rawPlaylist);

    const playlist = await Playlist.findOne();
    const playable = await Playable.findOne();
    const playables = await playlist?.$get("playables");

    expect(playables).toHaveLength(1);
    expect(playables?.at(0)?.id).toEqual(playable?.id);
  });

  it("preserves the order of the playables when extracting from the raw-playlist", async () => {
    const rawPlayable1 = createRawPlayable();
    const rawPlayable2 = createRawPlayable();
    const rawPlaylist = createRawPlaylist({
      entries: [rawPlayable1, rawPlayable2],
      requested_entries: [20, 21],
    });

    await convertRawInfo(rawPlaylist);

    const playable1 = await Playable.findOne({
      include: [{ model: Playlist }],
    });

    const playable2 = await Playable.findOne({
      offset: 1,
      include: [{ model: Playlist }],
    });

    expect(playable1?.playlists.at(0)?.PlayablePlaylist.order).toEqual(20);
    expect(playable2?.playlists.at(0)?.PlayablePlaylist.order).toEqual(21);
  });
});
