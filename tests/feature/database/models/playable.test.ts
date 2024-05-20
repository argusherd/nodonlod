import Chapter from "@/database/models/chapters";
import Playable from "@/database/models/playable";
import Tag from "@/database/models/tag";
import Taggable from "@/database/models/taggable";
import {
  createPlayable,
  createPlaylist,
  createUploader,
} from "../../setup/create-model";

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

  it("can belong to an uploader", async () => {
    const uploader = await createUploader();
    const playable = await createPlayable({ uploaderId: uploader.id });

    const belongsTo = await playable.$get("uploader");

    expect(belongsTo?.id).toEqual(uploader.id);
  });

  it("resets the uploaderId if the uploader got deleted", async () => {
    const uploader = await createUploader();
    const playable = await createPlayable({ uploaderId: uploader.id });

    await uploader.destroy();

    await playable.reload();

    expect(playable.uploaderId).toBeNull();
  });

  it("has many chapters", async () => {
    const playable = await createPlayable();

    const ep1 = await Chapter.create({
      playableId: playable.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    const ep2 = await Chapter.create({
      playableId: playable.id,
      title: "ep2",
      startTime: 120,
      endTime: 300,
    });

    const hasMany = await playable.$get("chapters");

    expect(hasMany).toHaveLength(2);
    expect(hasMany.at(0)?.id).toEqual(ep1.id);
    expect(hasMany.at(1)?.id).toEqual(ep2.id);
  });

  it("can belong to many tags", async () => {
    const playable = await createPlayable();
    const tag1 = await Tag.create({ name: "foo" });
    const tag2 = await Tag.create({ name: "bar" });

    await playable.$add("tag", [tag1, tag2]);

    const tags = await playable.$get("tags");
    const taggable = await Taggable.findOne();

    expect(tags).toHaveLength(2);
    expect(tags.at(0)?.name).toEqual("foo");
    expect(tags.at(1)?.name).toEqual("bar");
    expect(taggable?.taggableType).toEqual("playable");
  });
});
