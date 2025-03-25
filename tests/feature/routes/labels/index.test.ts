import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label index page", () => {
  it("displays all available labels", async () => {
    const label1 = await createLabel();
    const label2 = await createLabel({ category: "foo" });

    await supertest(express)
      .get("/labels")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain(label2.category);
        expect(res.text).toContain(`/labels/${label1.id}`);
        expect(res.text).toContain(`/labels/${label2.id}`);
      });
  });
});
