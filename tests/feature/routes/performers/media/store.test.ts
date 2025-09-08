import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The performer medium store route", () => {
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
