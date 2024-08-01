import Playlist from "@/database/models/playlist";
import express from "@/routes";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-model";

describe("The destroy playlist route", () => {
  it("deletes the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express).delete(`/playlists/${playlist.id}`).expect(204);

    expect(await Playlist.count()).toEqual(0);
  });

  it("instructs htmx to navigate to the playlist index page after deleting the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .delete(`/playlists/${playlist.id}`)
      .expect(204)
      .expect("HX-Location", "/playlists");
  });
});
