import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import { createMedium, createPlaylist } from "../../setup/create-model";

describe("The tag model", () => {
  it("can belong to many media", async () => {
    const tag = await Tag.create({ name: "foo" });
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await tag.$add("medium", [medium1, medium2]);

    const mediumIds = (await tag.$get("media")).map((medium) => medium.id);
    const taggable = await Taggable.findOne();

    expect(mediumIds).toHaveLength(2);
    expect(mediumIds).toContain(medium1.id);
    expect(mediumIds).toContain(medium2.id);
    expect(taggable?.taggableType).toEqual("medium");
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
