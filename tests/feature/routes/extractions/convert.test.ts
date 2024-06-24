import Extraction from "@/database/models/extraction";
import express from "@/routes";
import RawInfoConverter from "@/src/raw-info-converter";
import supertest from "supertest";
import {
  createRawMedium,
  createRawPlaylist,
  createSubRawMedium,
} from "../../setup/create-raw-info";

describe("The convert extraction raw info route", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const playlistURL =
    "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8";
  const overwritable = {
    title: undefined,
    description: undefined,
    thumbnail: undefined,
    ageLimit: undefined,
  };

  it("requires a resource id to locate specific raw info for conversion", async () => {
    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: "" })
      .expect(422);
  });

  it("calls the toPlayble method in the RawInfoConverter if a raw-medium is found", async () => {
    const mockedToMedium = jest
      .spyOn(RawInfoConverter.prototype, "toPlayble")
      .mockImplementation();

    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawMedium.id })
      .expect(201);

    expect(mockedToMedium).toHaveBeenCalledWith(rawMedium, overwritable);
  });

  it("calls the toPlaylist method in the RawInfoConverter if a raw-playlist is found", async () => {
    const mockedToPlaylist = jest
      .spyOn(RawInfoConverter.prototype, "toPlaylist")
      .mockImplementation();

    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawPlaylist.id })
      .expect(201);

    expect(mockedToPlaylist).toHaveBeenCalledWith(rawPlaylist, overwritable);
  });

  it("can find the raw-info deeply nested in the raw-playlist", async () => {
    const mockedToMedium = jest
      .spyOn(RawInfoConverter.prototype, "toPlayble")
      .mockImplementation();

    const subRawMedium = createSubRawMedium();
    const childRawPlaylist = createRawPlaylist({ entries: [subRawMedium] });
    const rawPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: subRawMedium.id })
      .expect(201);

    expect(mockedToMedium).toHaveBeenCalledWith(subRawMedium, overwritable);
  });

  it("returns a 404 response if the raw info with the provided id is not found", async () => {
    const mockedToMedium = jest
      .spyOn(RawInfoConverter.prototype, "toPlayble")
      .mockImplementation();

    const mockedToPlaylist = jest
      .spyOn(RawInfoConverter.prototype, "toPlaylist")
      .mockImplementation();

    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: "NOT_EXISTS" })
      .expect(404);

    expect(mockedToMedium).not.toHaveBeenCalled();
    expect(mockedToPlaylist).not.toHaveBeenCalled();
  });

  it("can overwrite some properties of the raw-medium", async () => {
    const mockedToMedium = jest
      .spyOn(RawInfoConverter.prototype, "toPlayble")
      .mockImplementation();

    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({
        resourceId: rawMedium.id,
        title: "New title",
        description: "New description",
        thumbnail: "https://foo.com/bar.jpg",
        ageLimit: 18,
      })
      .expect(201);

    expect(mockedToMedium).toHaveBeenCalledWith(rawMedium, {
      title: "New title",
      description: "New description",
      thumbnail: "https://foo.com/bar.jpg",
      ageLimit: "18",
    });
  });

  it("can overwrite some properties of the raw-playlist", async () => {
    const mockedToPlaylist = jest
      .spyOn(RawInfoConverter.prototype, "toPlaylist")
      .mockImplementation();

    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({
        resourceId: rawPlaylist.id,
        title: "New title",
        description: "New description",
        thumbnail: "https://foo.com/bar.jpg",
      })
      .expect(201);

    expect(mockedToPlaylist).toHaveBeenCalledWith(rawPlaylist, {
      title: "New title",
      description: "New description",
      thumbnail: "https://foo.com/bar.jpg",
    });
  });
});
