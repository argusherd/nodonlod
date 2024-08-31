import Playlist from "@/database/models/playlist";
import { createMedium, createPlaylist } from "../../setup/create-model";

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
});
