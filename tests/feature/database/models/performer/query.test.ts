import Performer from "@/database/models/performer";
import dayjs from "dayjs";
import { createPerformer } from "../../../setup/create-model";

describe("The performer query method", () => {
  it("can limit the number of rows", async () => {
    await createPerformer();
    await createPerformer();
    await createPerformer();

    const { rows, count } = await Performer.query({ limit: 2 });

    expect(rows).toHaveLength(2);
    expect(count).toEqual(3);
  });

  it("can sort the outcome in different orders", async () => {
    await createPerformer({ name: "a" });
    await createPerformer({ name: "b" });
    await createPerformer({ name: "c" });

    const { rows: inAsc } = await Performer.query({
      sort: "name",
      sortBy: "asc",
    });

    expect(inAsc.at(0)?.name).toEqual("a");
    expect(inAsc.at(2)?.name).toEqual("c");

    const { rows: inDesc } = await Performer.query({
      sort: "name",
      sortBy: "desc",
    });

    expect(inDesc.at(0)?.name).toEqual("c");
    expect(inDesc.at(2)?.name).toEqual("a");
  });

  it("falls back to createdAt if the sort is not supported", async () => {
    const performer1 = await createPerformer({
      createdAt: dayjs().add(1, "d").toDate(),
    });
    const performer2 = await createPerformer({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });
    const performer3 = await createPerformer();

    const { rows } = await Performer.query({
      sort: "not supported",
      sortBy: "asc",
    });

    expect(rows.at(0)?.id).toEqual(performer2.id);
    expect(rows.at(1)?.id).toEqual(performer3.id);
    expect(rows.at(2)?.id).toEqual(performer1.id);
  });

  it("can skip certain number of rows", async () => {
    await createPerformer({ name: "a" });
    const performer = await createPerformer({ name: "b" });
    await createPerformer({ name: "c" });

    const { rows } = await Performer.query({
      limit: 1,
      offset: 1,
      sort: "name",
      sortBy: "asc",
    });

    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.id).toEqual(performer.id);
  });

  it("can filter the rows with name and description", async () => {
    const performer1 = await createPerformer({ name: "as foo 1" });
    const performer2 = await createPerformer({ name: "as bar 2" });
    const performer3 = await createPerformer({
      name: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Performer.query({ search: "foo" });
    const ids = rows.map((performer) => performer.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(performer1.id);
    expect(ids).toContain(performer3.id);
    expect(ids).not.toContain(performer2.id);
  });
});
