import express from "@/routes";
import supertest from "supertest";

describe("The home route", () => {
  it("displays hello world on the page", async () => {
    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.text.includes("hello world"));
      });
  });
});
