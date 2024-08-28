import Category from "@/database/models/category";
import Label from "@/database/models/label";
import Labelable from "@/database/models/labelable";
import { createMedium, createPlaylist } from "../../setup/create-model";

describe("The label model", () => {
  it("belongs to a category", async () => {
    const category = await Category.create({ name: "foo", type: "string" });
    const label = await Label.create({ categoryId: category.id, text: "bar" });
    const belongsTo = await label.$get("category");

    expect(belongsTo?.id).toEqual(category.id);
  });

  it("can belong to many media", async () => {
    const category = await Category.create({ name: "foo", type: "string" });
    const label = await Label.create({ categoryId: category.id, text: "bar" });
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await label.$add("medium", [medium1, medium2]);

    const mediumIds = (await label.$get("media")).map((medium) => medium.id);
    const taggable = await Labelable.findOne();

    expect(mediumIds).toHaveLength(2);
    expect(mediumIds).toContain(medium1.id);
    expect(mediumIds).toContain(medium2.id);
    expect(taggable?.labelableType).toEqual("medium");
  });

  it("can belong to many playlists", async () => {
    const category = await Category.create({ name: "foo", type: "string" });
    const label = await Label.create({ categoryId: category.id, text: "bar" });
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await label.$add("playlist", [playlist1, playlist2]);

    const playlistIds = (await label.$get("playlists")).map(
      (playlist) => playlist.id,
    );
    const taggable = await Labelable.findOne();

    expect(playlistIds).toHaveLength(2);
    expect(playlistIds).toContain(playlist1.id);
    expect(playlistIds).toContain(playlist2.id);
    expect(taggable?.labelableType).toEqual("playlist");
  });
});
