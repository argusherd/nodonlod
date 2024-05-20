import Chapter from "@/database/models/chapters";
import RawInfoConverter from "@/src/raw-info-converter";
import { createPlayable } from "../../setup/create-model";
import { createRawPlayable } from "../../setup/create-raw-info";

describe("The preserveAllChapters method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("preserves the chapters of the playable by providing a raw-playable with chapters and a playable id", async () => {
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({
      chapters: [{ start_time: 40, end_time: 120, title: "ep1" }],
    });

    await converter.preserveAllChapters(rawPlayable, playable.id);

    expect(await Chapter.count()).toEqual(1);

    const chapter = await Chapter.findOne();

    expect(chapter?.startTime).toEqual(40);
    expect(chapter?.endTime).toEqual(120);
    expect(chapter?.title).toEqual("ep1");
    expect(chapter?.playableId).toEqual(playable.id);
  });

  it("does not create two identical chapters when preserving all the chapters", async () => {
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({
      chapters: [{ start_time: 40, end_time: 120, title: "ep1" }],
    });

    await converter.preserveAllChapters(rawPlayable, playable.id);
    await converter.preserveAllChapters(rawPlayable, playable.id);

    expect(await Chapter.count()).toEqual(1);
  });
});
