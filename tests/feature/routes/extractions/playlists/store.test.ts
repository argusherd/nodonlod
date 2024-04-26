import Extraction from "@/database/models/extraction";
import Playlist from "@/database/models/playlist";
import express from "@/routes";
import supertest from "supertest";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../../setup/create-raw-info";

describe("The store a playlist from the extraction route", () => {
  it("can convert its raw-playlist content to a playlist record in the database", async () => {
    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(await Playlist.count()).toEqual(1);
    expect(playlist?.title).toEqual(rawPlaylist.title);
    expect(playlist?.url).toEqual(rawPlaylist.webpage_url);
    expect(playlist?.thumbnail).toEqual(rawPlaylist.thumbnails?.at(0)?.url);
    expect(playlist?.description).toEqual(rawPlaylist.description);
  });

  it("cannot convert the content to a playlist if there is none", async () => {
    const extraction = await Extraction.create({
      url: "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
      content: null,
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .expect(404);

    expect(await Playlist.count()).toEqual(0);
  });

  it("cannot convert the content to a playlist if the content is in a raw-playable format", async () => {
    const rawPlayable = createRawPlayable();

    const extraction = await Extraction.create({
      url: "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8",
      content: JSON.stringify(rawPlayable),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .expect(404);

    expect(await Playlist.count()).toEqual(0);
  });

  it("can overwrite the raw-playlist properties", async () => {
    const rawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .type("form")
      .send({
        title: "New title",
        thumbnail: "https://foo.bar/baz.jpg",
        description: "New description",
      })
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual("New title");
    expect(playlist?.thumbnail).toEqual("https://foo.bar/baz.jpg");
    expect(playlist?.description).toEqual("New description");
  });

  it("uses the resource id as the title if the provided title is empty", async () => {
    const rawPlaylist = createRawPlaylist({ title: "" });

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .type("form")
      .send({
        title: "",
      })
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual(rawPlaylist.id);
  });

  it("converts the topmost raw-playlist by default", async () => {
    const childRawPlaylist = createRawPlaylist();
    const rawPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(await Playlist.count()).toEqual(1);
    expect(playlist?.title).toEqual(rawPlaylist.title);
  });

  it("can convert the child raw-playlist by provided the resource id", async () => {
    const childRawPlaylist = createRawPlaylist();
    const rawPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playlists`)
      .type("form")
      .send({ resourceId: childRawPlaylist.id })
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(await Playlist.count()).toEqual(1);
    expect(playlist?.title).toEqual(childRawPlaylist.title);
  });
});
