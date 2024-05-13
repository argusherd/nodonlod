import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import { createPlayable, createPlaylist } from "../../setup/create-playable";

describe("The tag model", () => {
  it("can belong to many playables", async () => {
    const tag = await Tag.create({ name: "foo" });
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await tag.$add("playable", [playable1, playable2]);

    const playableIds = (await tag.$get("playables")).map(
      (playable) => playable.id,
    );
    const taggable = await Taggable.findOne();

    expect(playableIds).toHaveLength(2);
    expect(playableIds).toContain(playable1.id);
    expect(playableIds).toContain(playable2.id);
    expect(taggable?.taggableType).toEqual("playable");
  });

  it("can belong to many playlists", async () => {
    const tag = await Tag.create({ name: "foo" });
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await tag.$add("playlist", [playlist1, playlist2]);

    const playlistIds = (await tag.$get("playlists")).map(
      (playlist) => playlist.id,
    );
    const taggable = await Taggable.findOne();

    expect(playlistIds).toHaveLength(2);
    expect(playlistIds).toContain(playlist1.id);
    expect(playlistIds).toContain(playlist2.id);
    expect(taggable?.taggableType).toEqual("playlist");
  });
});
