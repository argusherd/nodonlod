import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer destroy route", () => {
  it("removes the relationship with the performer from the medium", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await medium.$add("performer", performer);

    await supertest(express)
      .delete(`/media/${medium.id}/performers/${performer.id}`)
      .expect(205);

    expect(await medium.$count("performers")).toEqual(0);
  });

  it("has a confirmation page", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await medium.$add("performer", performer);

    await supertest(express)
      .delete(`/media/${medium.id}/performers/${performer.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this performer?",
        );
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer.id}`,
        );
      });
  });
});
