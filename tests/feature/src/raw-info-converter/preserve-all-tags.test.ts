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
});
