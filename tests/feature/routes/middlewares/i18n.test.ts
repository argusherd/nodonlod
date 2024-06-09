import express from "@/routes";
import supertest from "supertest";

describe("The i18n middleware", () => {
  it("sets the cookie if there is a locale in the query string", async () => {
    await supertest(express)
      .get("/?locale=zh-TW")
      .expect((res) => {
        expect(res.headers["set-cookie"]?.at(0)).toContain("locale=zh-TW");
      });
  });

  it("redirects the request back after setting the locale cookie", async () => {
    await supertest(express).get("/?locale=zh-TW").expect(302);
  });
});
