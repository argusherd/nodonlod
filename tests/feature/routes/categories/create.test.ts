import express from "@/routes";
import supertest from "supertest";
import { createCategory } from "../../setup/create-model";

describe("The category create page", () => {
  it("can display select column", async () => {
    await supertest(express).get("/categories/create/_select").expect(200);
  });

  it("can display all category options", async () => {
    const category1 = await createCategory();
    const category2 = await createCategory();

    await supertest(express)
      .get("/categories/create/_options")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(category1.name);
        expect(res.text).toContain(category2.name);
      });
  });

  it("can display create input columns", async () => {
    await supertest(express).get("/categories/create/_inputs").expect(200);
  });
});
