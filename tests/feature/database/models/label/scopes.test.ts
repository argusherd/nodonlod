import Label from "@/database/models/label";
import dayjs from "dayjs";
import { createLabel } from "../../../setup/create-model";

describe("The label scopes", () => {
  it("can sort the outcome in different orders", async () => {
    await createLabel({ text: "a" });
    await createLabel({ text: "b" });
    await createLabel({ text: "c" });

    const inAsc = await Label.scope({
      method: ["sort", "text", "asc"],
    }).findAll();

    expect(inAsc.at(0)?.text).toEqual("a");
    expect(inAsc.at(2)?.text).toEqual("c");

    const inDesc = await Label.scope({
      method: ["sort", "text", "desc"],
    }).findAll();

    expect(inDesc.at(0)?.text).toEqual("c");
    expect(inDesc.at(2)?.text).toEqual("a");
  });

  it("falls back to createdAt if the sort is not supported", async () => {
    const label1 = await createLabel({
      createdAt: dayjs().add(1, "d").toDate(),
    });
    const label2 = await createLabel({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });
    const label3 = await createLabel();

    const rows = await Label.scope({
      method: ["sort", "not supported", "asc"],
    }).findAll();

    expect(rows.at(0)?.id).toEqual(label2.id);
    expect(rows.at(1)?.id).toEqual(label3.id);
    expect(rows.at(2)?.id).toEqual(label1.id);
  });

  it("can search category or text at same time", async () => {
    await createLabel({ category: "as foo 1", text: "bar" });
    const bar = await createLabel({ category: "as foo 2", text: "baz" });

    const isCategoryFoo = await Label.scope({
      method: ["search", "foo"],
    }).findAll();

    expect(isCategoryFoo).toHaveLength(2);
    expect(isCategoryFoo.at(0)?.text).toEqual("bar");
    expect(isCategoryFoo.at(1)?.text).toEqual("baz");

    const isTextBaz = await Label.scope({
      method: ["search", "baz"],
    }).findAll();

    expect(isTextBaz).toHaveLength(1);
    expect(isTextBaz.at(0)?.id).toEqual(bar.id);
  });

  it("can call the search scope with empty value", async () => {
    await createLabel({ category: "foo", text: "bar" });
    await createLabel({ category: "foo", text: "baz" });

    const labels = await Label.scope({ method: ["search", ""] }).findAll();

    expect(labels).toHaveLength(2);
  });
});
