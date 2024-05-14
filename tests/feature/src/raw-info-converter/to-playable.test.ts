import Playable from "@/database/models/playable";
import Uploader from "@/database/models/uploader";
import RawInfoConverter from "@/src/raw-info-converter";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { createPlayable } from "../../setup/create-playable";
import { createRawPlayable } from "../../setup/create-raw-info";

describe("The toPlayable method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();

    jest.spyOn(converter, "preserveUploader").mockImplementation();
    jest.spyOn(converter, "preserveAllChapters").mockImplementation();
  });

  it("convert a raw-playable into a playable", async () => {
    const rawPlayable = createRawPlayable();

    await converter.toPlayble(rawPlayable);

    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();

    expect(playable?.url).toEqual(rawPlayable.webpage_url);
    expect(playable?.resourceId).toEqual(rawPlayable.id);
    expect(playable?.domain).toEqual(rawPlayable.webpage_url_domain);
    expect(playable?.title).toEqual(rawPlayable.title);
    expect(playable?.duration).toEqual(rawPlayable.duration);
    expect(playable?.description).toEqual(rawPlayable.description);
    expect(playable?.thumbnail).toEqual(rawPlayable.thumbnail);
    expect(playable?.ageLimit).toEqual(rawPlayable.age_limit);
    expect(playable?.uploadDate).toEqual(
      dayjs(rawPlayable.upload_date).toDate(),
    );
  });

  it("does not create two identical playables when converting the raw-playable", async () => {
    const rawPlayable = createRawPlayable();

    await converter.toPlayble(rawPlayable);
    await converter.toPlayble(rawPlayable);

    expect(await Playable.count()).toEqual(1);
  });

  it("updates the duration of a playable when converting the raw-playable associated with it", async () => {
    const playable = await createPlayable({ duration: 40 });

    const rawPlayable = createRawPlayable({
      webpage_url: playable.url,
      duration: 120,
    });

    await converter.toPlayble(rawPlayable);
    await playable.reload();

    expect(await Playable.count()).toEqual(1);
    expect(playable.duration).toEqual(120);
  });

  it("calls the preserveUploader method when converting a raw-playable into a playable", async () => {
    const mockedPreserveUploader = jest
      .spyOn(converter, "preserveUploader")
      .mockImplementation();
    const rawPlayable = createRawPlayable();

    await converter.toPlayble(rawPlayable);

    expect(mockedPreserveUploader).toHaveBeenCalledWith(rawPlayable);
  });

  it("establishes a relationship between the playable and the uploader when converting the raw-playable", async () => {
    const uploader = await Uploader.create({
      url: faker.internet.url(),
      name: faker.person.fullName(),
    });
    const rawPlayable = createRawPlayable();

    jest.spyOn(converter, "preserveUploader").mockResolvedValue(uploader);

    await converter.toPlayble(rawPlayable);

    const playable = await Playable.findOne();

    expect(playable?.uploaderId).toEqual(uploader?.id);
  });

  it("establishes a relationship between the playable and the uploader, even if the playable already exists", async () => {
    const uploader = await Uploader.create({
      url: faker.internet.url(),
      name: faker.person.fullName(),
    });
    const playable = await createPlayable();
    const rawPlayable = createRawPlayable({ webpage_url: playable.url });

    jest.spyOn(converter, "preserveUploader").mockResolvedValue(uploader);

    expect(playable.uploaderId).toBeUndefined();

    await converter.toPlayble(rawPlayable);
    await playable.reload();

    expect(playable.uploaderId).toEqual(uploader.id);
  });

  it("calls the preserveAllChapters method when converting a raw-playable into a playable", async () => {
    const mockedPreserveAllChapters = jest
      .spyOn(converter, "preserveAllChapters")
      .mockImplementation();
    const rawPlayable = createRawPlayable();

    await converter.toPlayble(rawPlayable);

    const playable = await Playable.findOne();

    expect(mockedPreserveAllChapters).toHaveBeenCalledWith(
      rawPlayable,
      playable?.id,
    );
  });

  it("calls the preserveAllTags method when converting a raw-playable into a playable", async () => {
    const mockedPreserveAllTags = jest
      .spyOn(converter, "preserveAllTags")
      .mockImplementation();

    const rawPlayable = createRawPlayable({ tags: ["foo", "bar"] });

    await converter.toPlayble(rawPlayable);

    expect(mockedPreserveAllTags).toHaveBeenCalled();
  });
});
