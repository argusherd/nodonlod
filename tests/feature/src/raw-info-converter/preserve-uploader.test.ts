import Uploader from "@/database/models/uploader";
import RawInfoConverter from "@/src/raw-info-converter";
import { createRawPlayable } from "../../setup/create-raw-info";

describe("The preserveUploader method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("creates an uploader based on a raw-playable", async () => {
    const rawPlayable = createRawPlayable();

    await converter.preserveUploader(rawPlayable);

    expect(await Uploader.count()).toEqual(1);

    const uploader = await Uploader.findOne();

    expect(uploader?.url).toEqual(rawPlayable.channel_url);
    expect(uploader?.name).toEqual(rawPlayable.channel);
  });

  it("does not create two identical uploaders when preserving the uploader but updates the name instead", async () => {
    const rawPlayable = createRawPlayable();

    await converter.preserveUploader(rawPlayable);

    rawPlayable.channel = "New name";

    await converter.preserveUploader(rawPlayable);

    const uploader = await Uploader.findOne();

    expect(uploader?.name).toEqual("New name");
  });

  it("falls back to the uploader_url and uploader properties if there is no channel information when preserving the uploader", async () => {
    const rawPlayable = createRawPlayable({
      channel: undefined,
      channel_url: undefined,
    });

    await converter.preserveUploader(rawPlayable);

    expect(await Uploader.count()).toEqual(1);

    const uploader = await Uploader.findOne();

    expect(uploader?.url).toEqual(rawPlayable.uploader_url);
    expect(uploader?.name).toEqual(rawPlayable.uploader);
  });

  it("does not create an uploader if the raw-playable does not contain channel or uploader information", async () => {
    const rawPlayable = createRawPlayable({
      channel: undefined,
      channel_url: undefined,
      uploader: undefined,
      uploader_url: undefined,
    });

    await converter.preserveUploader(rawPlayable);

    expect(await Uploader.count()).toEqual(0);
  });
});
