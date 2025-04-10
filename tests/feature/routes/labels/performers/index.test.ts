import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The label performer index page", () => {
  it("lists all performers associated with the label", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await label.$add("performer", [performer1, performer2]);

    await supertest(express)
      .get(`/labels/${label.id}/performers`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer2.id}`,
        );
      });
  });

  it("can request the list part of the page", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await label.$add("performer", [performer1, performer2]);

    await supertest(express)
      .get(`/labels/${label.id}/performers?_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer2.id}`,
        );
      });
  });
});
