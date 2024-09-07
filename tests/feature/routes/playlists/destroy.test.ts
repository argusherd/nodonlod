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

  it("can display a confirmation message for deletion", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .delete(`/playlists/${playlist.id}/confirm`)
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete this playlist?",
        );
        expect(res.text).toContain(`/playlists/${playlist.id}`);
      });
  });
});
