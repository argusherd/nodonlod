import Chapter from "@/database/models/chapter";
import RawInfoConverter from "@/src/raw-info-converter";
import { createMedium } from "../../setup/create-model";
import { createRawMedium } from "../../setup/create-raw-info";

describe("The preserveAllChapters method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("preserves the chapters of the medium by providing a raw-medium with chapters and a medium id", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      chapters: [{ start_time: 40, end_time: 120, title: "ep1" }],
    });

    await converter.preserveAllChapters(rawMedium, medium.id);

    expect(await Chapter.count()).toEqual(1);

    const chapter = await Chapter.findOne();

    expect(chapter?.startTime).toEqual(40);
    expect(chapter?.endTime).toEqual(120);
    expect(chapter?.title).toEqual("ep1");
    expect(chapter?.mediumId).toEqual(medium.id);
  });

  it("does not create two identical chapters when preserving all the chapters", async () => {
    const medium = await createMedium();
    const rawMedium = createRawMedium({
      chapters: [{ start_time: 40, end_time: 120, title: "ep1" }],
    });

    await converter.preserveAllChapters(rawMedium, medium.id);
    await converter.preserveAllChapters(rawMedium, medium.id);

    expect(await Chapter.count()).toEqual(1);
  });
});
