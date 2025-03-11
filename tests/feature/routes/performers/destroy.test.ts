import Performer from "@/database/models/performer";
import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer destroy route", () => {
  it("has a conformation page", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .delete(`/performers/${performer.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete this performer",
        );
        expect(res.text).toContain(`/performers/${performer.id}`);
      });
  });

  it("remove the performer from the database", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .delete(`/performers/${performer.id}`)
      .expect(204)
      .expect("hx-location", `/performers`);

    expect(await Performer.count()).toEqual(0);
  });
});
