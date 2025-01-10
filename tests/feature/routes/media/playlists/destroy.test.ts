import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlists destroy route", () => {
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
