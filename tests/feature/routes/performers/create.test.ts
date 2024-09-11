import express from "@/routes";
import supertest from "supertest";

describe("The create performer page", () => {
  it("displays a form that can create a new performer", async () => {
    await supertest(express)
      .get("/performers/create")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("/performers");
        expect(res.text).toContain("name");
        expect(res.text).toContain("thumbnail");
        expect(res.text).toContain("description");
      });
  });

  it("tells htmx to open the modal to show the creation form", async () => {
    await supertest(express)
      .get("/performers/create")
      .expect(200)
      .expect("HX-Trigger", "open-modal");
  });
});
