import Medium from "@/database/models/medium";
import RawInfoConverter from "@/src/raw-info-converter";
import dayjs from "dayjs";
import { createMedium, createUploader } from "../../setup/create-model";
import { createRawMedium } from "../../setup/create-raw-info";

describe("The toMedium method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();

    jest.spyOn(converter, "preserveUploader").mockImplementation();
    jest.spyOn(converter, "preserveAllChapters").mockImplementation();
  });

  it("convert a raw-medium into a medium", async () => {
    const rawMedium = createRawMedium();

    await converter.toPlayble(rawMedium);

    expect(await Medium.count()).toEqual(1);

    const medium = await Medium.findOne();

    expect(medium?.url).toEqual(rawMedium.webpage_url);
    expect(medium?.resourceId).toEqual(rawMedium.id);
    expect(medium?.domain).toEqual(rawMedium.webpage_url_domain);
    expect(medium?.title).toEqual(rawMedium.title);
    expect(medium?.duration).toEqual(rawMedium.duration);
    expect(medium?.description).toEqual(rawMedium.description);
    expect(medium?.thumbnail).toEqual(rawMedium.thumbnail);
    expect(medium?.ageLimit).toEqual(rawMedium.age_limit);
    expect(medium?.uploadDate).toEqual(dayjs(rawMedium.upload_date).toDate());
  });

  it("does not create two identical media when converting the raw-medium", async () => {
    const rawMedium = createRawMedium();

    await converter.toPlayble(rawMedium);
    await converter.toPlayble(rawMedium);

    expect(await Medium.count()).toEqual(1);
  });

  it("updates the duration of a medium when converting the raw-medium associated with it", async () => {
    const medium = await createMedium({ duration: 40 });

    const rawMedium = createRawMedium({
      webpage_url: medium.url,
      duration: 120,
    });

    await converter.toPlayble(rawMedium);
    await medium.reload();

    expect(await Medium.count()).toEqual(1);
    expect(medium.duration).toEqual(120);
  });

  it("can overwrite some properties when converting the raw-medium", async () => {
    const rawMedium = createRawMedium();

    await converter.toPlayble(rawMedium, {
      title: "New title",
      description: "New description",
      thumbnail: "https://foo.com/bar.jpg",
      ageLimit: 18,
    });

    const medium = await Medium.findOne();

    expect(medium?.title).toEqual("New title");
    expect(medium?.description).toEqual("New description");
    expect(medium?.thumbnail).toEqual("https://foo.com/bar.jpg");
    expect(medium?.ageLimit).toEqual(18);
  });

  it("can overwrite some properties even if the related medium already existed when converting the raw-medium", async () => {
    const medium = await createMedium();

    const rawMedium = createRawMedium({ webpage_url: medium.url });

    await converter.toPlayble(rawMedium, {
      title: "New title",
      description: "New description",
      thumbnail: "https://foo.com/bar.jpg",
      ageLimit: 18,
    });

    await medium.reload();

    expect(medium?.title).toEqual("New title");
    expect(medium?.description).toEqual("New description");
    expect(medium?.thumbnail).toEqual("https://foo.com/bar.jpg");
    expect(medium?.ageLimit).toEqual(18);
  });

  it("can overwrite some properties with empty values when converting the raw-medium", async () => {
    const rawMedium = createRawMedium({ age_limit: 18 });

    await converter.toPlayble(rawMedium, {
      title: "",
      description: "",
      thumbnail: "",
      ageLimit: "",
    });

    const medium = await Medium.findOne();

    expect(medium?.title).toEqual("");
    expect(medium?.description).toEqual("");
    expect(medium?.thumbnail).toEqual("");
    expect(medium?.ageLimit).toEqual(0);
  });

  it("calls the preserveUploader method when converting a raw-medium into a medium", async () => {
    const mockedPreserveUploader = jest
      .spyOn(converter, "preserveUploader")
      .mockImplementation();
    const rawMedium = createRawMedium();

    await converter.toPlayble(rawMedium);

    expect(mockedPreserveUploader).toHaveBeenCalledWith(rawMedium);
  });

  it("establishes a relationship between the medium and the uploader when converting the raw-medium", async () => {
    const uploader = await createUploader();
    const rawMedium = createRawMedium();

    jest.spyOn(converter, "preserveUploader").mockResolvedValue(uploader);

    await converter.toPlayble(rawMedium);

    const medium = await Medium.findOne();

    expect(medium?.uploaderId).toEqual(uploader?.id);
  });

  it("establishes a relationship between the medium and the uploader, even if the medium already exists", async () => {
    const uploader = await createUploader();
    const medium = await createMedium();
    const rawMedium = createRawMedium({ webpage_url: medium.url });

    jest.spyOn(converter, "preserveUploader").mockResolvedValue(uploader);

    expect(medium.uploaderId).toBeUndefined();

    await converter.toPlayble(rawMedium);
    await medium.reload();

    expect(medium.uploaderId).toEqual(uploader.id);
  });

  it("calls the preserveAllChapters method when converting a raw-medium into a medium", async () => {
    const mockedPreserveAllChapters = jest
      .spyOn(converter, "preserveAllChapters")
      .mockImplementation();
    const rawMedium = createRawMedium();

    await converter.toPlayble(rawMedium);

    const medium = await Medium.findOne();

    expect(mockedPreserveAllChapters).toHaveBeenCalledWith(
      rawMedium,
      medium?.id,
    );
  });

  it("calls the preserveAllTags method when converting a raw-medium into a medium", async () => {
    const mockedPreserveAllTags = jest
      .spyOn(converter, "preserveAllTags")
      .mockImplementation();

    const rawMedium = createRawMedium({ tags: ["foo", "bar"] });

    await converter.toPlayble(rawMedium);

    expect(mockedPreserveAllTags).toHaveBeenCalled();
  });
});
