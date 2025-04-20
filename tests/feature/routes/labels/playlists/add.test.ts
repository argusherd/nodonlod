import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPlaylist } from "../../../setup/create-model";

describe("The label playlist add route", () => {
  it("displays all available playlists", async () => {
    const label = await createLabel();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/labels/${label.id}/playlists/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(
          `/labels/${label.id}/playlists/${playlist1.id}`,
        );
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(
          `/labels/${label.id}/playlists/${playlist2.id}`,
        );
      });
  });

  it("can filter playlists by title", async () => {
    const label = await createLabel();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/labels/${label.id}/playlists/add?title=${playlist1.title}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(
          `/labels/${label.id}/playlists/${playlist1.id}`,
        );
        expect(res.text).not.toContain(playlist2.title);
        expect(res.text).not.toContain(
          `/labels/${label.id}/playlists/${playlist2.id}`,
        );
      });
  });

  it("establishes a relationship between the label and the playlist", async () => {
    const label = await createLabel();
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/labels/${label.id}/playlists/${playlist.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlists");
      });

    const playlists = await label.$get("playlists");

    expect(playlists).toHaveLength(1);
    expect(playlists.at(0)?.title).toEqual(playlist.title);
  });
});
