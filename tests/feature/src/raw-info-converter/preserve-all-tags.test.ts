import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import RawInfoConverter from "@/src/raw-info-converter";
import { createPlayable } from "../../setup/create-playable";
import { createRawPlayable } from "../../setup/create-raw-info";

describe("The preserveAllTags method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("preserves the tags of the playable by providing a raw-playable with tags and a playable id", async () => {
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({
      webpage_url: playable.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawPlayable, playable);

    expect(await Tag.count()).toEqual(1);

    const tag = await Tag.findOne();

    expect(tag?.name).toEqual("foo");
  });

  it("does not create two identical tags when preserving all the tags", async () => {
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({
      webpage_url: playable.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawPlayable, playable);
    await converter.preserveAllTags(rawPlayable, playable);

    expect(await Tag.count()).toEqual(1);
  });

  it("establishes a relationship between the playable and the tags when preserving all the tags", async () => {
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({
      webpage_url: playable.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawPlayable, playable);

    expect(await Taggable.count()).toEqual(1);

    const tag = await Tag.findOne();
    const belongsToMany = await Taggable.findOne();

    expect(belongsToMany?.taggableId).toEqual(playable.id);
    expect(belongsToMany?.tagId).toEqual(tag?.id);
  });
});
