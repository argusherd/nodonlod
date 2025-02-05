import Playlist from "@/database/models/playlist";
import express from "@/routes";
import supertest from "supertest";

describe("The playlist store route", () => {
  it("requires a title to create a new playlist", async () => {
    await supertest(express)
      .post("/playlists")
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The title is missing");
      });
  });

  it("creates a new playlist", async () => {
    await supertest(express)
      .post("/playlists")
      .type("form")
      .send({
        title: "foo",
        thumbnail: "https://foo.bar/image",
        description: "bar",
      })
      .expect(201)
      .expect((res) => {
        expect(res.headers["hx-location"]).toContain("/playlists/");
      });

    const playlist = await Playlist.findOne();

    expect(playlist?.title).toEqual("foo");
    expect(playlist?.thumbnail).toEqual("https://foo.bar/image");
    expect(playlist?.description).toEqual("bar");
  });
});
