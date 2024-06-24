import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import RawInfoConverter from "@/src/raw-info-converter";
import { createMedium } from "../../setup/create-model";
import { createRawMedium } from "../../setup/create-raw-info";

describe("The preserveAllTags method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("preserves the tags of the medium by providing a raw-medium with tags and a medium id", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    expect(await Tag.count()).toEqual(1);

    const tag = await Tag.findOne();

    expect(tag?.name).toEqual("foo");
  });

  it("does not create two identical tags when preserving all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);
    await converter.preserveAllTags(rawMedium, medium);

    expect(await Tag.count()).toEqual(1);
  });

  it("establishes a relationship between the medium and the tags when preserving all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    expect(await Taggable.count()).toEqual(1);

    const tag = await Tag.findOne();
    const belongsToMany = await Taggable.findOne();

    expect(belongsToMany?.taggableId).toEqual(medium.id);
    expect(belongsToMany?.tagId).toEqual(tag?.id);
  });
});
