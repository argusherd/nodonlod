import Uploader from "@/database/models/uploader";
import RawInfoConverter from "@/src/raw-info-converter";
import { createRawMedium } from "../../setup/create-raw-info";

describe("The preserveUploader method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("creates an uploader based on a raw-medium", async () => {
    const rawMedium = createRawMedium();

    await converter.preserveUploader(rawMedium);

    expect(await Uploader.count()).toEqual(1);

    const uploader = await Uploader.findOne();

    expect(uploader?.url).toEqual(rawMedium.channel_url);
    expect(uploader?.name).toEqual(rawMedium.channel);
  });

  it("does not create two identical uploaders when preserving the uploader but updates the name instead", async () => {
    const rawMedium = createRawMedium();

    await converter.preserveUploader(rawMedium);

    rawMedium.channel = "New name";

    await converter.preserveUploader(rawMedium);

    const uploader = await Uploader.findOne();

    expect(uploader?.name).toEqual("New name");
  });

  it("falls back to the uploader_url and uploader properties if there is no channel information when preserving the uploader", async () => {
    const rawMedium = createRawMedium({
      channel: undefined,
      channel_url: undefined,
    });

    await converter.preserveUploader(rawMedium);

    expect(await Uploader.count()).toEqual(1);

    const uploader = await Uploader.findOne();

    expect(uploader?.url).toEqual(rawMedium.uploader_url);
    expect(uploader?.name).toEqual(rawMedium.uploader);
  });

  it("does not create an uploader if the raw-medium does not contain channel or uploader information", async () => {
    const rawMedium = createRawMedium({
      channel: undefined,
      channel_url: undefined,
      uploader: undefined,
      uploader_url: undefined,
    });

    await converter.preserveUploader(rawMedium);

    expect(await Uploader.count()).toEqual(0);
  });
});
