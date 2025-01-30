import Chapter from "@/database/models/chapter";
import Extraction from "@/database/models/extraction";
import Label from "@/database/models/label";
import Medium from "@/database/models/medium";
import Playlist from "@/database/models/playlist";
import express from "@/routes";
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

  it("converts a raw-medium to a medium", async () => {
    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawMedium.id })
      .expect(200);

    expect(await Medium.count()).toEqual(1);

    const medium = await Medium.findOne();

    expect(medium?.resourceId).toEqual(rawMedium.id);
  });

  it("converts a raw-playlist to a playlist", async () => {
    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawPlaylist.id })
      .expect(200);

    expect(await Playlist.count()).toEqual(1);

    const playlist = await Playlist.findOne();

    expect(playlist?.resourceId).toEqual(rawPlaylist.id);
  });

  it("can find the raw-info deeply nested in the raw-playlist", async () => {
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
      .expect(200);

    expect(await Medium.count()).toEqual(1);

    const medium = await Medium.findOne();

    expect(medium?.resourceId).toEqual(subRawMedium.id);
  });

  it("returns a 404 response if the raw info with the provided id is not found", async () => {
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
  });

  it("can overwrite some properties of the raw-medium", async () => {
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
      .expect(200);

    const medium = await Medium.findOne();

    expect(medium?.title).toEqual("New title");
    expect(medium?.description).toEqual("New description");
    expect(medium?.thumbnail).toEqual("https://foo.com/bar.jpg");
    expect(medium?.ageLimit).toEqual(18);
  });

  it("can overwrite some properties of the raw-playlist", async () => {
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
      .expect(200);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual("New title");
    expect(playlist?.description).toEqual("New description");
    expect(playlist?.thumbnail).toEqual("https://foo.com/bar.jpg");
  });

  it("returns the converted medium link in the response", async () => {
    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawMedium),
    });

    let resText = "";

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawMedium.id })
      .expect(200)
      .expect((res) => (resText = res.text));

    const medium = await Medium.findOne();

    expect(resText).toContain(`/media/${medium?.id}`);
  });

  it("returns the converted playlist link in the response", async () => {
    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    let resText = "";

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawPlaylist.id })
      .expect(200)
      .expect((res) => (resText = res.text));

    const playlist = await Playlist.findOne();

    expect(resText).toContain(`/playlists/${playlist?.id}`);
  });

  it("can preserve the chapters from the raw medium", async () => {
    const rawMedium = createRawMedium({
      chapters: [{ title: "foo", start_time: 0, end_time: 10 }],
    });

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawMedium.id, includeChapters: true })
      .expect(200);

    const chapter = await Chapter.findOne();

    expect(chapter?.title).toEqual("foo");
    expect(chapter?.startTime).toEqual(0);
    expect(chapter?.endTime).toEqual(10);
  });

  it("can preserve the tags from the raw medium", async () => {
    const rawMedium = createRawMedium({ tags: ["foo", "bar"] });

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/convert`)
      .type("form")
      .send({ resourceId: rawMedium.id, includeTags: true })
      .expect(200);

    const labels = await Label.findAll({ order: [["text", "ASC"]] });

    expect(labels).toHaveLength(2);
    expect(labels.at(0)?.text).toEqual("bar");
    expect(labels.at(1)?.text).toEqual("foo");
  });
});
