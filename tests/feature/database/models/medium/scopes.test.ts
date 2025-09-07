import Medium from "@/database/models/medium";
import dayjs from "dayjs";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium scopes", () => {
  it("can sort the outcome in different orders", async () => {
    await createMedium({ title: "a" });
    await createMedium({ title: "b" });
    await createMedium({ title: "c" });

    const inAsc = await Medium.scope({
      method: ["sort", "title", "asc"],
    }).findAll();

    expect(inAsc.at(0)?.title).toEqual("a");
    expect(inAsc.at(2)?.title).toEqual("c");

    const inDesc = await Medium.scope({
      method: ["sort", "title", "desc"],
    }).findAll();

    expect(inDesc.at(0)?.title).toEqual("c");
    expect(inDesc.at(2)?.title).toEqual("a");
  });

  it("falls back to createdAt if the sort is not supported", async () => {
    const medium1 = await createMedium({
      createdAt: dayjs().add(1, "d").toDate(),
    });
    const medium2 = await createMedium({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });
    const medium3 = await createMedium();

    const rows = await Medium.scope({
      method: ["sort", "not supported", "asc"],
    }).findAll();

    expect(rows.at(0)?.id).toEqual(medium2.id);
    expect(rows.at(1)?.id).toEqual(medium3.id);
    expect(rows.at(2)?.id).toEqual(medium1.id);
  });

  it("can filter the rows with title and description", async () => {
    const medium1 = await createMedium({ title: "as foo 1" });
    const medium2 = await createMedium({ title: "as bar 2" });
    const medium3 = await createMedium({
      title: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Medium.scope({
      method: ["search", "foo"],
    }).findAndCountAll();

    const ids = rows.map((medium) => medium.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(medium1.id);
    expect(ids).toContain(medium3.id);
    expect(ids).not.toContain(medium2.id);
  });

  it("can retrieve rows with associated performers", async () => {
    const medium = await createMedium({ title: "1" });
    await createMedium({ title: "2" });
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    const withPerformers = await Medium.scope("withPerformers").findAll({
      where: { title: "1" },
    });
    const withoutPerformers = await Medium.scope("withPerformers").findAll({
      where: { title: "2" },
    });

    expect(withPerformers).toHaveLength(1);
    expect(withPerformers.at(0)?.performers).toHaveLength(2);
    expect(withoutPerformers).toHaveLength(1);
    expect(withoutPerformers.at(0)?.performers).toHaveLength(0);

    const ids = withPerformers
      .at(0)
      ?.performers.map((performer) => performer.id);

    expect(ids).toContain(performer1.id);
    expect(ids).toContain(performer2.id);
  });

  it("distinguishes the number of rows with associated performers", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    const { count } = await Medium.scope("withPerformers").findAndCountAll({
      distinct: true,
    });

    expect(count).toEqual(1);
  });
});
