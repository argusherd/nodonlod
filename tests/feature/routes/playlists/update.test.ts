import express from "@/routes";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-model";

describe("The playlist update route", () => {
  it("requires a title to update the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .put(`/playlists/${playlist.id}`)
      .expect(422)
      .expect("hx-trigger", "data-failed")
      .expect((res) => {
        expect(res.text).toContain("The title is missing");
      });
  });

  it("updates the playlist's information", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .put(`/playlists/${playlist.id}`)
      .type("form")
      .send({
        title: "new title",
        thumbnail: "https://new-thumbnail",
        description: "new description",
      })
      .expect(200)
      .expect("hx-trigger", "data-saved");

    await playlist.reload();

    expect(playlist.title).toEqual("new title");
    expect(playlist.thumbnail).toEqual("https://new-thumbnail");
    expect(playlist.description).toEqual("new description");
  });
});
