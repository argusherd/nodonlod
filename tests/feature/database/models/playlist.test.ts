import Labelable from "@/database/models/labelable";
import Playlist from "@/database/models/playlist";
import {
  createLabel,
  createMedium,
  createPlaylist,
  createPlaylistable,
} from "../../setup/create-model";

describe("The playlist model", () => {
  it("can persist one record to the database", async () => {
    const playlist = await Playlist.create({
      title: "The playlist title",
      url: "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
      thumbnail: "https://foo.bar/baz.jpg",
      description: "The playlist description",
    });

    expect(playlist.id).not.toBeNull();
    expect(playlist.title).toEqual("The playlist title");
    expect(playlist.url).toEqual(
      "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
    );
    expect(playlist.thumbnail).toEqual("https://foo.bar/baz.jpg");
    expect(playlist.description).toEqual("The playlist description");
  });

  it("can belongs to many media", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();

    await playlist.$add("medium", medium);
    const belongsToMany = await playlist.$get("media");

    expect(belongsToMany).toHaveLength(1);
    expect(belongsToMany.at(0)?.id).toEqual(medium.id);
  });

  it("can belongs to many labels", async () => {
    const playlist = await createPlaylist();
    const label = await createLabel();

    await playlist.$add("label", [label]);

    const belongsToMany = await playlist.$get("labels");

    expect(belongsToMany).toHaveLength(1);
    expect(belongsToMany[0]?.id).toEqual(label.id);
  });

  it("removes all associated labels before deletion", async () => {
    const playlist = await createPlaylist();
    const label = await createLabel();

    await playlist.$add("label", [label]);

    expect(await Labelable.count()).toEqual(1);

    await playlist.destroy();

    expect(await Labelable.count()).toEqual(0);
  });

  it("can reorder associated playlist items", async () => {
    const playlist = await createPlaylist();
    const playlistable1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 9,
    });
    const playlistable2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 10,
    });
    const playlistable3 = await createPlaylistable({
      playlistId: playlist.id,
      order: 69,
    });

    await playlist.reorderPlaylistables();

    await playlistable1.reload();
    await playlistable2.reload();
    await playlistable3.reload();

    expect(playlistable1.order).toEqual(1);
    expect(playlistable2.order).toEqual(2);
    expect(playlistable3.order).toEqual(3);
  });

  it("reorders NULL order items to the last", async () => {
    const playlist = await createPlaylist();
    const nullOrder = await createPlaylistable({ playlistId: playlist.id });
    const shouldBe1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });

    await playlist.reorderPlaylistables();

    await nullOrder.reload();
    await shouldBe1.reload();

    expect(nullOrder.order).toEqual(2);
    expect(shouldBe1.order).toEqual(1);
  });

  it("reorders items based on the descending updatedAt column if they are in the same order", async () => {
    const playlist = await createPlaylist();
    const became1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 69,
    });
    const remain2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 69,
    });

    became1.changed("updatedAt", true);
    await became1.save();

    await playlist.reorderPlaylistables();
    await became1.reload();
    await remain2.reload();

    expect(became1.order).toEqual(1);
    expect(remain2.order).toEqual(2);
  });
});
