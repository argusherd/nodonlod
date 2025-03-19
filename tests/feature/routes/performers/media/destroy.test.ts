import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The performer medium destroy route", () => {
  it("has a confirmation page", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();

    await performer.$add("medium", medium);

    await supertest(express)
      .delete(`/performers/${performer.id}/media/${medium.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this medium",
        );
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium.id}`,
        );
      });
  });

  it("removes the relationship with the performer from the medium", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();

    await performer.$add("medium", medium);

    await supertest(express)
      .delete(`/performers/${performer.id}/media/${medium.id}`)
      .expect(204)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-media");
      });

    expect(await performer.$count("media")).toEqual(0);
  });
});
