import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label show page", () => {
  it("displays the details of the label", async () => {
    const label = await createLabel({ category: "foo", text: "bar" });

    await supertest(express)
      .get(`/labels/${label.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label.category);
        expect(res.text).toContain(label.text);
      });
  });
});
