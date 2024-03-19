import Playable, {
  PlayableCreationAttributes,
} from "@/database/models/playable";
import express from "@/routes";
import { faker } from "@faker-js/faker";
import supertest from "supertest";

describe("The playable index page", () => {
  const createAttributes = (): PlayableCreationAttributes => ({
    url: faker.internet.url(),
    resourceId: faker.string.uuid(),
    domain: faker.internet.domainName(),
    title: faker.lorem.text(),
    duration: faker.number.int({ min: 1, max: 600 }),
  });

  it("lists all playables and provides a link for each playable", async () => {
    const playable1 = await Playable.create(createAttributes());
    const playable2 = await Playable.create(createAttributes());

    await supertest(express)
      .get("/playables")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playable1.title);
        expect(res.text).toContain(playable2.title);
        expect(res.text).toContain(`/playables/${playable1.id}`);
        expect(res.text).toContain(`/playables/${playable2.id}`);
      });
  });
});
