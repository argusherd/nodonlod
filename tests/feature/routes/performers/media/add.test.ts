import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The performer medium add route", () => {
  it("has a dedicated add page", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await supertest(express)
      .get(`/performers/${performer.id}/media/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium1.id}`,
        );
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium2.id}`,
        );
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("can filter available media by title", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium({ title: "foo" });
    const medium2 = await createMedium({ title: "bar" });

    await supertest(express)
      .get(`/performers/${performer.id}/media/add?search=${medium2.title}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("establishes the relationship between the performer and the medium", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();

    await supertest(express)
      .post(`/performers/${performer.id}/media/${medium.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-media");
      });

    const media = await performer.$get("media");

    expect(media).toHaveLength(1);
    expect(media.at(0)?.id).toEqual(medium.id);
  });
});
