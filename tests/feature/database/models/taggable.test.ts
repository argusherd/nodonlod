import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import { createPlayable } from "../../setup/create-model";

describe("The pivot between tag and taggable", () => {
  it("removes the relationship once the tag has been deleted", async () => {
    const tag = await Tag.create({ name: "foo" });
    const playable = await createPlayable();

    await tag.$add("playable", playable);

    expect(await Taggable.count()).toEqual(1);

    await tag.destroy();

    expect(await Taggable.count()).toEqual(0);
  });
});
