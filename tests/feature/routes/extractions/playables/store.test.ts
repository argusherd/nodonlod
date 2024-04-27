import Extraction from "@/database/models/extraction";
import Playable from "@/database/models/playable";
import express from "@/routes";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import supertest from "supertest";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../../setup/create-raw-info";

describe("The store a playable from the extraction route", () => {
  it("can convert its raw-playable content to a playable record in the database", async () => {
    const rawPlayable = createRawPlayable();

    const extractoin = await Extraction.create({
      url: rawPlayable.webpage_url,
      content: JSON.stringify(rawPlayable),
    });

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .expect(201);

    const playable = await Playable.findOne();

    expect(await Playable.count()).toEqual(1);
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

  it("cannot convert the content to a playable if there is none", async () => {
    const extractoin = await Extraction.create({
      url: faker.internet.url(),
      content: null,
    });

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .expect(404);

    expect(await Playable.count()).toEqual(0);
  });

  it("must provide a resource id if the raw-playable is in a raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });
    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playables`)
      .expect(404);

    expect(await Playable.count()).toEqual(0);

    await supertest(express)
      .post(`/extractions/${extraction.id}/playables`)
      .type("form")
      .send({
        resourceId: rawPlayable.id,
      })
      .expect(201);

    const playable = await Playable.findOne();

    expect(await Playable.count()).toEqual(1);
    expect(playable?.url).toEqual(rawPlayable.webpage_url);
  });

  it("sometimes needs to look deep into the nested raw-playlist content to retrieve the given raw-playable", async () => {
    const rawPlayable = createRawPlayable();
    const innerRawPlaylist = createRawPlaylist({ entries: [rawPlayable] });
    const rawPlaylist = createRawPlaylist({
      entries: [createRawPlaylist(), innerRawPlaylist],
    });

    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playables`)
      .type("form")
      .send({
        resourceId: rawPlayable.id,
      })
      .expect(201);

    const playable = await Playable.findOne();

    expect(await Playable.count()).toEqual(1);
    expect(playable?.url).toEqual(rawPlayable.webpage_url);
  });

  it("responses 404 status code if the given raw-playable is not in the raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });
    const extraction = await Extraction.create({
      url: rawPlaylist.webpage_url,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .post(`/extractions/${extraction.id}/playables`)
      .type("form")
      .send({
        resourceId: "NOT_EXISTS",
      })
      .expect(404);

    expect(await Playable.count()).toEqual(0);
  });

  it("can overwrite some of the raw-playable properties", async () => {
    const rawPlayable = createRawPlayable();
    const extractoin = await Extraction.create({
      url: rawPlayable.webpage_url,
      content: JSON.stringify(rawPlayable),
    });

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .type("form")
      .send({
        title: "The new title",
        description: "New description",
        thumbnail: "https://foo.bar/baz.jpg",
        ageLimit: 20,
      })
      .expect(201);

    const playable = await Playable.findOne();

    expect(playable?.title).toEqual("The new title");
    expect(playable?.description).toEqual("New description");
    expect(playable?.thumbnail).toEqual("https://foo.bar/baz.jpg");
    expect(playable?.ageLimit).toEqual(20);
  });

  it("can overwrite the title, description or thumbnail to empty string", async () => {
    const rawPlayable = createRawPlayable();
    const extractoin = await Extraction.create({
      url: rawPlayable.webpage_url,
      content: JSON.stringify(rawPlayable),
    });

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .type("form")
      .send({
        title: "",
        description: "",
        thumbnail: "",
      })
      .expect(201);

    const playable = await Playable.findOne();

    expect(playable?.title).toEqual("");
    expect(playable?.description).toEqual("");
    expect(playable?.thumbnail).toEqual("");
  });

  it("does not create a same playable twince", async () => {
    const rawPlayable = createRawPlayable();
    const extractoin = await Extraction.create({
      url: rawPlayable.webpage_url,
      content: JSON.stringify(rawPlayable),
    });

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .expect(201);

    await supertest(express)
      .post(`/extractions/${extractoin.id}/playables`)
      .type("form")
      .send({ title: "New title" })
      .expect(201);

    const playable = await Playable.findOne();

    expect(await Playable.count()).toEqual(1);
    expect(playable?.title).toEqual("New title");
  });
});
