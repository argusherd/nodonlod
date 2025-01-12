import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../../setup/create-model";

describe("The medium playlist store route", () => {
  it("can create a new playlist and establish a relationship with the medium", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/playlists`)
      .type("form")
      .send({ title: "foo" })
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlists");
      });

    const playlists = await medium.$get("playlists");

    expect(playlists).toHaveLength(1);
    expect(playlists.at(0)?.title).toEqual("foo");
  });

  it("requires a non-empty title to create a new playlists", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/playlists`)
      .type("form")
      .send({ title: "" })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The title is missing");
      });
  });
});
