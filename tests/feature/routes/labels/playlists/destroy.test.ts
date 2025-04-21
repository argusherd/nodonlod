import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPlaylist } from "../../../setup/create-model";

describe("The label playlist destroy route", () => {
  it("has a confirmation page", async () => {
    const label = await createLabel();
    const playlist = await createPlaylist();

    await label.$add("playlist", playlist);

    await supertest(express)
      .delete(`/labels/${label.id}/playlists/${playlist.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this playlist?",
        );
        expect(res.text).toContain(
          `/labels/${label.id}/playlists/${playlist.id}`,
        );
      });
  });

  it("removes the relationship between the playlist and the label", async () => {
    const label = await createLabel();
    const playlist = await createPlaylist();

    await label.$add("playlist", playlist);

    await supertest(express)
      .delete(`/labels/${label.id}`)
      .expect(205)
      .expect("hx-location", "/labels");

    expect(await label.$count("playlists")).toEqual(0);
  });
});
