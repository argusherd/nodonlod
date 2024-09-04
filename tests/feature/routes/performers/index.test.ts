import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer index page", () => {
  it("lists the names and thumbnails of the performers", async () => {
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get("/performers")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(performer1.thumbnail);
        expect(res.text).toContain(performer2.thumbnail);
        expect(res.text).toContain(`/performers/${performer1.id}`);
        expect(res.text).toContain(`/performers/${performer2.id}`);
      });
  });

  it("displays 10 results per page and sorts them by name in ascending order", async () => {
    for (let i = 0; i < 10; i++) await createPerformer();

    const eleventh = await createPerformer({ name: "zzz" });

    await supertest(express)
      .get("/performers")
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(eleventh.name);
      });

    await supertest(express)
      .get("/performers?page=2")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(eleventh.name);
      });
  });
});
