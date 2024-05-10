import dayjs from "dayjs";
import Chapter from "../database/models/chapters";
import Playable from "../database/models/playable";
import PlayablePlaylist from "../database/models/playable-playlist";
import Playlist from "../database/models/playlist";
import Uploader from "../database/models/uploader";
import { RawPlayable, RawPlaylist, SubRawPlayable } from "./raw-info-extractor";

export default class RawInfoConverter {
  async convertAll(rawInfo: RawPlayable | RawPlaylist) {
    if (rawInfo._type === "playlist") {
      await this.fromRawPlaylistAndEntries(rawInfo);
    }

    if (rawInfo._type === "video") {
      await this.toPlayble(rawInfo);
    }
  }

  async fromRawPlaylistAndEntries(rawPlaylist: RawPlaylist) {
    const playlist = await this.toPlaylist(rawPlaylist);

    const entry = rawPlaylist.entries.at(0);

    if (entry && "_type" in entry && entry._type === "playlist") {
      for (const childRawPlaylist of rawPlaylist.entries)
        await this.fromRawPlaylistAndEntries(childRawPlaylist as RawPlaylist);

      return;
    }

    const playables: Playable[] = [];

    for (const subRawPlayable of rawPlaylist.entries)
      playables.push(await this.toPlayble(subRawPlayable as SubRawPlayable));

    await this.createAssociation(
      playlist,
      playables,
      rawPlaylist.requested_entries,
    );
  }

  async toPlaylist(rawPlaylist: RawPlaylist) {
    let playlist = await Playlist.findOne({
      where: { url: rawPlaylist.webpage_url },
    });

    if (playlist) return playlist;

    return await Playlist.create({
      title: rawPlaylist.title || rawPlaylist.id,
      url: rawPlaylist.webpage_url,
      resourceId: rawPlaylist.id,
      domain: rawPlaylist.webpage_url_domain,
      thumbnail: rawPlaylist.thumbnails && rawPlaylist.thumbnails[0]?.url,
      description: rawPlaylist.description,
    });
  }

  async toPlayble(rawPlayable: RawPlayable | SubRawPlayable) {
    let playable = await Playable.findOne({
      where: { url: rawPlayable.webpage_url },
    });

    const uploader = await this.preserveUploader(rawPlayable);

    if (playable) {
      await playable.update({
        uploaderId: uploader?.id,
        duration: rawPlayable.duration,
      });
    } else {
      playable = await Playable.create({
        uploaderId: uploader?.id,
        url: rawPlayable.webpage_url,
        resourceId: rawPlayable.id,
        domain: rawPlayable.webpage_url_domain,
        title: rawPlayable.title,
        duration: rawPlayable.duration,
        description: rawPlayable.description,
        thumbnail: rawPlayable.thumbnail,
        ageLimit: rawPlayable.age_limit,
        uploadDate: rawPlayable.upload_date
          ? dayjs(rawPlayable.upload_date).toDate()
          : undefined,
      });
    }

    await this.preserveAllChapters(rawPlayable, playable.id);

    return playable;
  }

  async createAssociation(
    playlist: Playlist,
    playables: Playable[],
    orders: number[] = [],
  ) {
    await PlayablePlaylist.bulkCreate(
      playables.map((playable, idx) => ({
        playableId: playable.id,
        playlistId: playlist.id,
        order: orders.at(idx),
      })),
      {
        conflictAttributes: ["playableId", "playlistId"],
        updateOnDuplicate: ["order", "updatedAt"],
      },
    );
  }

  async preserveUploader(rawInfo: RawPlayable | SubRawPlayable) {
    const url = rawInfo.channel_url ?? rawInfo.uploader_url;
    const name = rawInfo.channel ?? rawInfo.uploader ?? "";

    if (!url) return;

    const uploader = await Uploader.findOne({ where: { url } });

    if (uploader) {
      return await uploader.update({ name });
    }

    return await Uploader.create({ url, name });
  }

  async preserveAllChapters(
    rawPlayable: RawPlayable | SubRawPlayable,
    playableId: string,
  ) {
    for (const {
      start_time: startTime,
      end_time: endTime,
      title,
    } of rawPlayable.chapters ?? []) {
      const chapter = await Chapter.findOne({
        where: { playableId, startTime, endTime },
      });

      if (!chapter)
        await Chapter.create({
          playableId,
          startTime,
          endTime,
          title,
        });
    }
  }
}
