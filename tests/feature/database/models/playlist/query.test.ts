import Playlist from "@/database/models/playlist";
import dayjs from "dayjs";
import { createPlaylist } from "../../../setup/create-model";

describe("The playlist query method", () => {
  it("can limit the number of rows", async () => {
    await createPlaylist();
    await createPlaylist();
    await createPlaylist();

    const { rows, count } = await Playlist.query({ limit: 2 });

    expect(rows).toHaveLength(2);
    expect(count).toEqual(3);
  });

  it("can sort the outcome in different orders", async () => {
    await createPlaylist({ title: "a" });
    await createPlaylist({ title: "b" });
    await createPlaylist({ title: "c" });

    const { rows: inAsc } = await Playlist.query({
      sort: "title",
      sortBy: "asc",
    });

    expect(inAsc.at(0)?.title).toEqual("a");
    expect(inAsc.at(2)?.title).toEqual("c");

    const { rows: inDesc } = await Playlist.query({
      sort: "title",
      sortBy: "desc",
    });

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

    const { rows } = await Playlist.query({
      sort: "not supported",
      sortBy: "asc",
    });

    expect(rows.at(0)?.id).toEqual(playlist2.id);
    expect(rows.at(1)?.id).toEqual(playlist3.id);
    expect(rows.at(2)?.id).toEqual(playlist1.id);
  });

  it("can skip certain number of rows", async () => {
    await createPlaylist({ title: "a" });
    const playlist = await createPlaylist({ title: "b" });
    await createPlaylist({ title: "c" });

    const { rows } = await Playlist.query({
      limit: 1,
      offset: 1,
      sort: "title",
      sortBy: "asc",
    });

    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.id).toEqual(playlist.id);
  });

  it("can filter the rows with title and description", async () => {
    const playlist1 = await createPlaylist({ title: "as foo 1" });
    const playlist2 = await createPlaylist({ title: "as bar 2" });
    const playlist3 = await createPlaylist({
      title: "as bar 3",
      description: "as foo 3",
    });

    const { rows, count } = await Playlist.query({ search: "foo" });
    const ids = rows.map((playlist) => playlist.id);

    expect(count).toEqual(2);
    expect(rows).toHaveLength(2);
    expect(ids).toContain(playlist1.id);
    expect(ids).toContain(playlist3.id);
    expect(ids).not.toContain(playlist2.id);
  });
});
