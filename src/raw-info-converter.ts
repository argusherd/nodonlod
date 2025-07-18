import dayjs from "dayjs";
import { Op } from "sequelize";
import Chapter from "../database/models/chapter";
import Label, { LabelCreationAttributes } from "../database/models/label";
import Medium from "../database/models/medium";
import Playlist from "../database/models/playlist";
import Playlistable from "../database/models/playlistable";
import Uploader from "../database/models/uploader";
import { RawMedium, RawPlaylist, SubRawMedium } from "./raw-info-extractor";

export interface Overwritable {
  title: string;
  description: string;
  thumbnail: string;
  ageLimit: string | number;
}

export default class RawInfoConverter {
  shouldPreserveChapters = true;
  shouldPreserveTags = true;

  async convertAll(rawInfo: RawMedium | RawPlaylist) {
    if (rawInfo._type === "playlist") {
      await this.fromRawPlaylistAndEntries(rawInfo);
    }

    if (rawInfo._type === "video") {
      await this.toMedium(rawInfo);
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

    const media: Medium[] = [];

    for (const subRawMedium of rawPlaylist.entries)
      media.push(await this.toMedium(subRawMedium as SubRawMedium));

    await this.createAssociation(playlist, media);
  }

  async toPlaylist(
    rawPlaylist: RawPlaylist,
    { title, thumbnail, description }: Partial<Overwritable> = {},
  ) {
    let playlist = await Playlist.findOne({
      where: { url: rawPlaylist.webpage_url },
    });

    const overwritable = {
      title: title || playlist?.title || rawPlaylist.title || rawPlaylist.id,
      thumbnail:
        thumbnail || playlist?.thumbnail || rawPlaylist.thumbnails?.at(0)?.url,
      description:
        description || playlist?.description || rawPlaylist.description,
    };

    if (playlist) return await playlist.update(overwritable);

    return await Playlist.create({
      url: rawPlaylist.webpage_url,
      resourceId: rawPlaylist.id,
      domain: rawPlaylist.webpage_url_domain,
      ...overwritable,
    });
  }

  async toMedium(
    rawMedium: RawMedium | SubRawMedium,
    { title, description, thumbnail, ageLimit }: Partial<Overwritable> = {},
  ) {
    let medium = await Medium.findOne({
      where: { url: rawMedium.webpage_url },
    });

    const uploader = await this.preserveUploader(rawMedium);

    const overwritable = {
      title: title || medium?.title || rawMedium.title,
      description: description || medium?.description || rawMedium.description,
      thumbnail: thumbnail || medium?.thumbnail || rawMedium.thumbnail,
      ageLimit: ageLimit !== undefined ? Number(ageLimit) : rawMedium.age_limit,
    };

    if (medium) {
      await medium.update({
        uploaderId: uploader?.id,
        duration: rawMedium.duration,
        ...overwritable,
      });
    } else {
      medium = await Medium.create({
        uploaderId: uploader?.id,
        url: rawMedium.webpage_url,
        resourceId: rawMedium.id,
        domain: rawMedium.webpage_url_domain,
        duration: rawMedium.duration,
        uploadDate: rawMedium.upload_date
          ? dayjs(rawMedium.upload_date).toDate()
          : undefined,
        ...overwritable,
      });
    }

    if (this.shouldPreserveChapters)
      await this.preserveAllChapters(rawMedium, medium.id);

    if (this.shouldPreserveTags) await this.preserveAllTags(rawMedium, medium);

    return medium;
  }

  async createAssociation(playlist: Playlist, media: Medium[]) {
    let order = Number(
      await Playlistable.max("order", { where: { playlistId: playlist.id } }),
    );

    for (const medium of media) {
      const playlistable = await Playlistable.findOne({
        where: {
          playlistId: playlist.id,
          mediumId: medium.id,
          chapterId: null,
        },
      });

      if (playlistable) return;

      await Playlistable.create({
        playlistId: playlist.id,
        mediumId: medium.id,
        order: ++order,
      });
    }
  }

  async preserveUploader(rawInfo: RawMedium | SubRawMedium) {
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
    rawMedium: RawMedium | SubRawMedium,
    mediumId: string,
  ) {
    for (const {
      start_time: startTime,
      end_time: endTime,
      title,
    } of rawMedium.chapters ?? []) {
      const chapter = await Chapter.findOne({
        where: { mediumId, startTime, endTime },
      });

      if (!chapter)
        await Chapter.create({
          mediumId,
          startTime,
          endTime,
          title,
        });
    }
  }

  async preserveAllTags(rawMedium: RawMedium | SubRawMedium, medium: Medium) {
    const existsTags = await Label.findAll({
      where: {
        text: { [Op.in]: rawMedium.tags ?? [] },
      },
    });
    const existsTexts = existsTags.map((label) => label.text.toLowerCase());
    const missingTexts: LabelCreationAttributes[] = [];

    for (const tag of rawMedium.tags ?? [])
      if (!existsTexts.some((text) => text == tag.toLowerCase()))
        missingTexts.push({ text: tag });

    await Label.bulkCreate(missingTexts);

    const missingTags = await Label.findAll({
      where: {
        text: { [Op.in]: missingTexts.map((data) => data.text) },
      },
    });

    await medium.$add("label", existsTags);
    await medium.$add("label", missingTags);
  }
}
