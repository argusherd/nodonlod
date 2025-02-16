import Label from "@/database/models/label";
import Labelable from "@/database/models/labelable";
import {
  createLabel,
  createMedium,
  createPlaylist,
} from "../../setup/create-model";

describe("The label model", () => {
  it("can belong to many media", async () => {
    const label = await createLabel();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await label.$add("medium", [medium1, medium2]);

    const mediumIds = (await label.$get("media")).map((medium) => medium.id);
    const labelable = await Labelable.findOne();

    expect(mediumIds).toHaveLength(2);
    expect(mediumIds).toContain(medium1.id);
    expect(mediumIds).toContain(medium2.id);
    expect(labelable?.labelableType).toEqual("medium");
  });

  it("can belong to many playlists", async () => {
    const label = await createLabel();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await label.$add("playlist", [playlist1, playlist2]);

    const playlistIds = (await label.$get("playlists")).map(
      (playlist) => playlist.id,
    );
    const labelable = await Labelable.findOne();

    expect(playlistIds).toHaveLength(2);
    expect(playlistIds).toContain(playlist1.id);
    expect(playlistIds).toContain(playlist2.id);
    expect(labelable?.labelableType).toEqual("playlist");
  });

  it("can search category or text at same time", async () => {
    await createLabel({ category: "foo", text: "bar" });
    const bar = await createLabel({ category: "foo", text: "baz" });

    const isCategoryFoo = await Label.scope({
      method: ["search", "foo"],
    }).findAll();

    expect(isCategoryFoo).toHaveLength(2);
    expect(isCategoryFoo.at(0)?.text).toEqual("bar");
    expect(isCategoryFoo.at(1)?.text).toEqual("baz");

    const isTextBaz = await Label.scope({
      method: ["search", "baz"],
    }).findAll();

    expect(isTextBaz).toHaveLength(1);
    expect(isTextBaz.at(0)?.id).toEqual(bar.id);
  });

  it("can call the search scope with empty value", async () => {
    await createLabel({ category: "foo", text: "bar" });
    await createLabel({ category: "foo", text: "baz" });

    const labels = await Label.scope({ method: ["search", ""] }).findAll();

    expect(labels).toHaveLength(2);
  });
});
