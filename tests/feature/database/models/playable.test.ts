import Playable from "@/database/models/playable";

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
});
