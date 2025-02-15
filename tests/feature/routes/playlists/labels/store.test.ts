import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPlaylist } from "../../../setup/create-model";

describe("The playlist label store route", () => {
  it("requires a text param to create a new label", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/playlists/${playlist.id}/labels`)
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The text is missing");
      });
  });

  it("establishes the relationship between the playlist and the new label", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/playlists/${playlist.id}/labels`)
      .type("form")
      .send({ text: "foo" })
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-labels");
      });

    const labels = await playlist.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.text).toEqual("foo");
  });

  it("will not create a same label twice", async () => {
    const playlist = await createPlaylist();
    const label = await createLabel();

    await supertest(express)
      .post(`/playlists/${playlist.id}/labels`)
      .type("form")
      .send({ text: label.text })
      .expect(205);

    const labels = await playlist.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.id).toEqual(label.id);
  });
});
