import Chapter from "@/database/models/chapter";
import Medium from "@/database/models/medium";
import Performer from "@/database/models/performer";
import {
  createMedium,
  createPerformer,
  createPlaylist,
  createUploader,
} from "../../setup/create-model";

describe("The medium model", () => {
  it("can persist one record to the database", async () => {
    const medium = await Medium.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      resourceId: "dQw4w9WgXcQ",
      domain: "youtube.com",
      title: "Rick Astley - Never Gonna Give You Up",
      duration: 212,
    });

    expect(await Medium.count()).toEqual(1);
    expect(medium.id).not.toBeNull();
    expect(medium.url).toEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(medium.resourceId).toEqual("dQw4w9WgXcQ");
    expect(medium.domain).toEqual("youtube.com");
    expect(medium.title).toEqual("Rick Astley - Never Gonna Give You Up");
    expect(medium.duration).toEqual(212);
  });

  it("can belongs to many playlists", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await medium.$add("playlist", playlist);
    const belongsToMany = await medium.$get("playlists");

    expect(belongsToMany).toHaveLength(1);
    expect(belongsToMany.at(0)?.id).toEqual(playlist.id);
  });

  it("can belong to an uploader", async () => {
    const uploader = await createUploader();
    const medium = await createMedium({ uploaderId: uploader.id });

    const belongsTo = await medium.$get("uploader");

    expect(belongsTo?.id).toEqual(uploader.id);
  });

  it("resets the uploaderId if the uploader got deleted", async () => {
    const uploader = await createUploader();
    const medium = await createMedium({ uploaderId: uploader.id });

    await uploader.destroy();

    await medium.reload();

    expect(medium.uploaderId).toBeNull();
  });

  it("has many chapters", async () => {
    const medium = await createMedium();

    const ep1 = await Chapter.create({
      mediumId: medium.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    const ep2 = await Chapter.create({
      mediumId: medium.id,
      title: "ep2",
      startTime: 120,
      endTime: 300,
    });

    const hasMany = await medium.$get("chapters");

    expect(hasMany).toHaveLength(2);
    expect(hasMany.at(0)?.id).toEqual(ep1.id);
    expect(hasMany.at(1)?.id).toEqual(ep2.id);
  });

  it("can belong to many performers", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    const performers = (await medium.$get("performers")).map(
      (performer: Performer) => performer.name,
    );

    expect(performers).toHaveLength(2);
    expect(performers).toContain(performer1.name);
    expect(performers).toContain(performer2.name);
  });
});
