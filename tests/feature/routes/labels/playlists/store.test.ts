import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../../setup/create-model";

describe("The label playlist store route", () => {
  it("has a dedicated page to create a new playlist", async () => {
    const label = await createLabel();

    await supertest(express)
      .get(`/labels/${label.id}/playlists/create`)
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(`/labels/${label.id}/playlists`);
      });
  });

  it("can create a new playlist and establish a relationship with the label", async () => {
    const label = await createLabel();

    await supertest(express)
      .post(`/labels/${label.id}/playlists`)
      .type("form")
      .send({
        title: "foo",
        thumbnail: "https://foo.com/bar.png",
        description: "bar",
      })
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlists");
      });

    const playlists = await label.$get("playlists");

    expect(playlists).toHaveLength(1);
    expect(playlists.at(0)?.title).toEqual("foo");
    expect(playlists.at(0)?.thumbnail).toEqual("https://foo.com/bar.png");
    expect(playlists.at(0)?.description).toEqual("bar");
  });

  it("requires a non-empty title to create a new playlists", async () => {
    const label = await createLabel();

    await supertest(express)
      .post(`/labels/${label.id}/playlists`)
      .type("form")
      .send({ title: "" })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The title is missing");
        expect(res.text).toContain(`/labels/${label.id}/playlists`);
      });
  });
});
