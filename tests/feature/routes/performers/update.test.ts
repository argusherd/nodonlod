import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer update route", () => {
  it("requires a name to update the performer", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .put(`/performers/${performer.id}`)
      .type("form")
      .send({ description: "new description" })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The name is missing");
      });

    await performer.reload();

    expect(performer.description).toEqual(performer.description);
  });

  it("can update the performer", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .put(`/performers/${performer.id}`)
      .type("form")
      .send({
        name: "new name",
        thumbnail: "https://new-thumbnail.com",
        description: "new description",
      })
      .expect(200);

    await performer.reload();

    expect(performer.name).toEqual("new name");
    expect(performer.thumbnail).toEqual("https://new-thumbnail.com");
    expect(performer.description).toEqual("new description");
  });
});
