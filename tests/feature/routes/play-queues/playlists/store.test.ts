import Playlist from "@/database/models/playlist";
import express from "@/routes";
import supertest from "supertest";
import { createPlayQueue } from "../../../setup/create-model";

describe("The play queue playlist store route", () => {
  it("creates a new playlist", async () => {
    await supertest(express)
      .post("/play-queues/playlists")
      .type("form")
      .send({
        title: "foo",
        description: "bar",
        thumbnail: "https://foo.com/bar.jpg",
      })
      .expect(201);

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual("foo");
    expect(playlist?.description).toEqual("bar");
    expect(playlist?.thumbnail).toEqual("https://foo.com/bar.jpg");
  });

  it("requires a title to create a playlist", async () => {
    await supertest(express)
      .post("/play-queues/playlists")
      .type("form")
      .send({
        title: "",
        description: "bar",
        thumbnail: "https://foo.com/bar.jpg",
      })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The title is missing.");
      });
  });

  it("tells the frontend to redirect to the created playlist page", async () => {
    await supertest(express)
      .post("/play-queues/playlists")
      .type("form")
      .send({ title: "foo" })
      .expect(201)
      .expect((res) => {
        expect(res.headers["hx-location"]).toContain("/playlists/");
      });
  });

  it("converts all items in the play queue to playlistables in the playlist", async () => {
    const playQueue1 = await createPlayQueue({ order: 420 });
    const playQueue2 = await createPlayQueue({ order: 69 });

    await supertest(express)
      .post("/play-queues/playlists")
      .type("form")
      .send({ title: "foo" })
      .expect(201);

    const playlist = await Playlist.findOne();
    const playlistables = await playlist?.$get("playlistables", {
      order: ["order"],
    });

    expect(playlistables).toHaveLength(2);
    expect(playlistables?.at(0)?.mediumId).toEqual(playQueue2.mediumId);
    expect(playlistables?.at(0)?.order).toEqual(1);
    expect(playlistables?.at(1)?.mediumId).toEqual(playQueue1.mediumId);
    expect(playlistables?.at(1)?.order).toEqual(2);
  });
});
