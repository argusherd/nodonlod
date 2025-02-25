import sequelize from "@/database/connection";
import Labelable from "@/database/models/labelable";
import Playlist from "@/database/models/playlist";
import {
  createLabel,
  createMedium,
  createPlaylist,
  createPlaylistItem,
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
    const item1 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 9,
    });
    const item2 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 10,
    });
    const item3 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 69,
    });

    sequelize.options.logging = console.log;
    await playlist.reorderPlaylistItems();
    sequelize.options.logging = undefined;

    await item1.reload();
    await item2.reload();
    await item3.reload();

    expect(item1.order).toEqual(1);
    expect(item2.order).toEqual(2);
    expect(item3.order).toEqual(3);
  });

  it("reorders NULL order items to the last", async () => {
    const playlist = await createPlaylist();
    const nullOrder = await createPlaylistItem({ playlistId: playlist.id });
    const shouldBe1 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 2,
    });

    await playlist.reorderPlaylistItems();

    await nullOrder.reload();
    await shouldBe1.reload();

    expect(nullOrder.order).toEqual(2);
    expect(shouldBe1.order).toEqual(1);
  });
});
