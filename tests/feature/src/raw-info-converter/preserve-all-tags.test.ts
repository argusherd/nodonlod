import Category from "@/database/models/category";
import Label from "@/database/models/label";
import Labelable from "@/database/models/labelable";
import RawInfoConverter from "@/src/raw-info-converter";
import { createMedium } from "../../setup/create-model";
import { createRawMedium } from "../../setup/create-raw-info";

describe("The preserveAllTags method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("creates a category to organize all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    expect(await Category.count()).toEqual(1);

    const category = await Category.findOne();

    expect(category?.name).toEqual("Tag");
  });

  it("does not create duplicate tag categories", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);
    await converter.preserveAllTags(rawMedium, medium);

    expect(await Category.count()).toEqual(1);
  });

  it("preserves the tags of the medium by providing a raw-medium with tags and a medium id", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    expect(await Label.count()).toEqual(1);

    const label = await Label.findOne();

    expect(label?.text).toEqual("foo");
  });

  it("does not create two identical tags when preserving all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);
    await converter.preserveAllTags(rawMedium, medium);

    expect(await Label.count()).toEqual(1);
  });

  it("establishes a relationship between the medium and the tags when preserving all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    expect(await Labelable.count()).toEqual(1);

    const label = await Label.findOne();
    const belongsToMany = await Labelable.findOne();

    expect(belongsToMany?.labelableId).toEqual(medium.id);
    expect(belongsToMany?.labelId).toEqual(label?.id);
  });

  it("establishes a relationship between the tags and the tag category while preserving all the tags", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      tags: ["foo"],
    });

    await converter.preserveAllTags(rawMedium, medium);

    const category = await Category.findOne();
    const label = await Label.findOne();

    expect(label?.categoryId).toEqual(category?.id);
  });
});
