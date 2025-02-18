import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPlaylist } from "../../../setup/create-model";

describe("The playlist label delete route", () => {
  it("removes relationship between the playlist and the label", async () => {
    const playlist = await createPlaylist();
    const label = await createLabel();

    await playlist.$add("label", label);

    await supertest(express)
      .delete(`/playlists/${playlist.id}/labels/${label.id}`)
      .expect(205)
      .expect("hx-trigger", "refresh-labels");

    expect(await playlist.$count("labels")).toEqual(0);
  });

  it("has a confirmation page", async () => {
    const playlist = await createPlaylist();
    const label = await createLabel();

    await playlist.$add("label", label);

    await supertest(express)
      .delete(`/playlists/${playlist.id}/labels/${label.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this label?",
        );
        expect(res.text).toContain(
          `/playlists/${playlist.id}/labels/${label.id}`,
        );
      });
  });
});
