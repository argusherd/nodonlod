import Performer from "@/database/models/performer";
import dayjs from "dayjs";
import { createPerformer } from "../../../setup/create-model";

describe("The performer scopes", () => {
  it("can sort the outcome in different orders", async () => {
    await createPerformer({ name: "a" });
    await createPerformer({ name: "b" });
    await createPerformer({ name: "c" });

    const inAsc = await Performer.scope({
      method: ["sort", "name", "asc"],
    }).findAll();

    expect(inAsc.at(0)?.name).toEqual("a");
    expect(inAsc.at(2)?.name).toEqual("c");

    const inDesc = await Performer.scope({
      method: ["sort", "name", "desc"],
    }).findAll();

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

    const rows = await Performer.scope({
      method: ["sort", "not supported", "asc"],
    }).findAll();

    expect(rows.at(0)?.id).toEqual(performer2.id);
    expect(rows.at(1)?.id).toEqual(performer3.id);
    expect(rows.at(2)?.id).toEqual(performer1.id);
  });

  it("can filter the rows with name and description", async () => {
    const performer1 = await createPerformer({ name: "as foo 1" });
    const performer2 = await createPerformer({ name: "as bar 2" });
    const performer3 = await createPerformer({
      name: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Performer.scope({
      method: ["search", "foo"],
    }).findAndCountAll();
    const ids = rows.map((performer) => performer.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(performer1.id);
    expect(ids).toContain(performer3.id);
    expect(ids).not.toContain(performer2.id);
  });
});
