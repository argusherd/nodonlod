import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPlaylist } from "../../../setup/create-model";

describe("The label playlist index page", () => {
  it("displays all the playlists to which the label belongs", async () => {
    const label = await createLabel();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await label.$add("playlist", [playlist1, playlist2]);

    await supertest(express)
      .get(`/labels/${label.id}/playlists`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
      });
  });

  it("can request the list part of the page", async () => {
    const label = await createLabel();
    const playlist = await createPlaylist();

    await label.$add("playlist", playlist);

    await supertest(express)
      .get(`/labels/${label.id}/playlists?_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist.title);
        expect(res.text).toContain(`/playlists/${playlist.id}`);
      });
  });
});
