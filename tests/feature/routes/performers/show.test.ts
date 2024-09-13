import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer show page", () => {
  it("responds with a 404 status code if the performer does not exist", async () => {
    await supertest(express).get("/performers/NOT_EXISTS").expect(404);
  });

  it("displays the name, thumbnail, and description of the performer", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .get(`/performers/${performer.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer.name);
        expect(res.text).toContain(performer.thumbnail);
        expect(res.text).toContain(performer.description);
      });
  });
});
