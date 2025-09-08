import Playlist from "@/database/models/playlist";
import dayjs from "dayjs";
import { createPlaylist } from "../../../setup/create-model";

describe("The playlist scopes", () => {
  it("can sort the outcome in different orders", async () => {
    await createPlaylist({ title: "a" });
    await createPlaylist({ title: "b" });
    await createPlaylist({ title: "c" });

    const inAsc = await Playlist.scope({
      method: ["sort", "title", "asc"],
    }).findAll();

    expect(inAsc.at(0)?.title).toEqual("a");
    expect(inAsc.at(2)?.title).toEqual("c");

    const inDesc = await Playlist.scope({
      method: ["sort", "title", "desc"],
    }).findAll();

    expect(inDesc.at(0)?.title).toEqual("c");
    expect(inDesc.at(2)?.title).toEqual("a");
  });

  it("falls back to createdAt if the sort is not supported", async () => {
    const playlist1 = await createPlaylist({
      createdAt: dayjs().add(1, "d").toDate(),
    });
    const playlist2 = await createPlaylist({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });
    const playlist3 = await createPlaylist();

    const rows = await Playlist.scope({
      method: ["sort", "not supported", "asc"],
    }).findAll();

    expect(rows.at(0)?.id).toEqual(playlist2.id);
    expect(rows.at(1)?.id).toEqual(playlist3.id);
    expect(rows.at(2)?.id).toEqual(playlist1.id);
  });

  it("can filter the rows with title and description", async () => {
    const playlist1 = await createPlaylist({ title: "as foo 1" });
    const playlist2 = await createPlaylist({ title: "as bar 2" });
    const playlist3 = await createPlaylist({
      title: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Playlist.scope({
      method: ["search", "foo"],
    }).findAndCountAll();
    const ids = rows.map((playlist) => playlist.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(playlist1.id);
    expect(ids).toContain(playlist3.id);
    expect(ids).not.toContain(playlist2.id);
  });
});
