import Medium from "@/database/models/medium";
import dayjs from "dayjs";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium query method", () => {
  it("can limit the number of rows", async () => {
    await createMedium();
    await createMedium();
    await createMedium();

    const { rows, count } = await Medium.query({ limit: 2 });

    expect(rows).toHaveLength(2);
    expect(count).toEqual(3);
  });

  it("can sort the outcome in different orders", async () => {
    await createMedium({ title: "a" });
    await createMedium({ title: "b" });
    await createMedium({ title: "c" });

    const { rows: inAsc } = await Medium.query({
      sort: "title",
      sortBy: "asc",
    });

    expect(inAsc.at(0)?.title).toEqual("a");
    expect(inAsc.at(2)?.title).toEqual("c");

    const { rows: inDesc } = await Medium.query({
      sort: "title",
      sortBy: "desc",
    });

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

    const { rows } = await Medium.query({
      sort: "not supported",
      sortBy: "asc",
    });

    expect(rows.at(0)?.id).toEqual(medium2.id);
    expect(rows.at(1)?.id).toEqual(medium3.id);
    expect(rows.at(2)?.id).toEqual(medium1.id);
  });

  it("can skip certain number of rows", async () => {
    await createMedium({ title: "a" });
    const medium = await createMedium({ title: "b" });
    await createMedium({ title: "c" });

    const { rows } = await Medium.query({
      limit: 1,
      offset: 1,
      sort: "title",
      sortBy: "asc",
    });

    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.id).toEqual(medium.id);
  });

  it("can filter the rows with title and description", async () => {
    const medium1 = await createMedium({ title: "as foo 1" });
    const medium2 = await createMedium({ title: "as bar 2" });
    const medium3 = await createMedium({
      title: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Medium.query({ search: "foo" });
    const ids = rows.map((medium) => medium.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(medium1.id);
    expect(ids).toContain(medium3.id);
    expect(ids).not.toContain(medium2.id);
  });

  it("comes with associated performers", async () => {
    const medium = await createMedium({ title: "1" });
    await createMedium({ title: "2" });
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    const { rows: withPerformers } = await Medium.query({ search: "1" });
    const { rows: withoutPerformers } = await Medium.query({ search: "2" });

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

    const { count } = await Medium.query();

    expect(count).toEqual(1);
  });
});
