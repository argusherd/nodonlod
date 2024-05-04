import Playable from "@/database/models/playable";
import Uploader from "@/database/models/uploader";
import { faker } from "@faker-js/faker";
import { createPlayable, createPlaylist } from "../../setup/create-playable";

describe("The playable model", () => {
  it("can persist one record to the database", async () => {
    const playable = await Playable.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      resourceId: "dQw4w9WgXcQ",
      domain: "youtube.com",
      title: "Rick Astley - Never Gonna Give You Up",
      duration: 212,
    });

    expect(await Playable.count()).toEqual(1);
    expect(playable.id).not.toBeNull();
    expect(playable.url).toEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(playable.resourceId).toEqual("dQw4w9WgXcQ");
    expect(playable.domain).toEqual("youtube.com");
    expect(playable.title).toEqual("Rick Astley - Never Gonna Give You Up");
    expect(playable.duration).toEqual(212);
  });

  it("can belongs to many playlists", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await playable.$add("playlist", playlist);
    const belongsToMany = await playable.$get("playlists");

    expect(belongsToMany).toHaveLength(1);
    expect(belongsToMany.at(0)?.id).toEqual(playlist.id);
  });

  it("treats the url and the resource id columns as a unique pair", async () => {
    const youtube = faker.internet.url();
    const spotify = faker.internet.url();
    const idFoo = faker.string.uuid();
    const idBar = faker.string.uuid();

    await createPlayable({ url: youtube, resourceId: idFoo });
    await createPlayable({ url: youtube, resourceId: idBar });
    await createPlayable({ url: spotify, resourceId: idFoo });
    await createPlayable({ url: spotify, resourceId: idBar });

    await expect(
      createPlayable({ url: spotify, resourceId: idFoo }),
    ).rejects.toThrow();

    expect(await Playable.count()).toEqual(4);
  });

  it("can belong to an uploader", async () => {
    const uploader = await Uploader.create({
      url: "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
      name: "Rick Astley",
    });
    const playable = await createPlayable({ uploaderId: uploader.id });

    const belongsTo = await playable.$get("uploader");

    expect(belongsTo?.id).toEqual(uploader.id);
  });

  it("resets the uploaderId if the uploader got deleted", async () => {
    const uploader = await Uploader.create({
      url: "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
      name: "Rick Astley",
    });
    const playable = await createPlayable({ uploaderId: uploader.id });

    await uploader.destroy();

    await playable.reload();

    expect(playable.uploaderId).toBeNull();
  });
});
