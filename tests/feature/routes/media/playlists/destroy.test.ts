import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlists destroy route", () => {
  it("has a confirmation page", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await medium.$add("playlist", playlist);

    await supertest(express)
      .delete(`/media/${medium.id}/playlists/${playlist.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this playlist?",
        );
        expect(res.text).toContain(
          `/media/${medium.id}/playlists/${playlist.id}`,
        );
      });
  });

  it("removes the relationship between the playlist and the medium", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await medium.$add("playlist", playlist);

    await supertest(express)
      .delete(`/media/${medium.id}/playlists/${playlist.id}`)
      .expect(205)
      .expect("HX-Trigger", "refresh-playlists");
  });
});
