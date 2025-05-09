import Chapter, { ChapterCreationAttributes } from "@/database/models/chapter";
import Label, { LabelCreationAttributes } from "@/database/models/label";
import Medium, { MediumCreationAttributes } from "@/database/models/medium";
import Performer, {
  PerformerCreationAttributes,
} from "@/database/models/performer";
import PlayQueue, {
  PlayQueueCreationAttributes,
} from "@/database/models/play-queue";
import Playlist, {
  PlaylistCreationAttributes,
} from "@/database/models/playlist";
import Playlistable, {
  PlaylistableCreationAttributes,
} from "@/database/models/playlistable";
import Uploader, {
  UploaderCreationAttributes,
} from "@/database/models/uploader";
import { faker } from "@faker-js/faker";

export const createMedium = async (
  overwrite?: Partial<MediumCreationAttributes>,
) =>
  await Medium.create({
    url: faker.internet.url(),
    resourceId: faker.string.uuid(),
    domain: faker.internet.domainName(),
    title: faker.lorem.text(),
    duration: faker.number.float({ min: 1, max: 600 }),
    ...overwrite,
  });

export const createPlaylist = async (
  overwrite?: Partial<PlaylistCreationAttributes>,
) =>
  await Playlist.create({
    title: faker.lorem.text(),
    ...overwrite,
  });

export const createUploader = async (
  overwrite?: Partial<UploaderCreationAttributes>,
) =>
  await Uploader.create({
    name: faker.person.fullName(),
    url: faker.internet.url(),
    ...overwrite,
  });

export const createChapter = async (
  overwrite?: Partial<ChapterCreationAttributes>,
) =>
  await Chapter.create({
    mediumId: overwrite?.mediumId || (await createMedium()).id,
    title: faker.lorem.slug(),
    ...overwrite,
  });

export const createPlayQueue = async (
  overwrite?: Partial<PlayQueueCreationAttributes>,
) =>
  await PlayQueue.create({
    mediumId: overwrite?.mediumId || (await createMedium()).id,
    ...overwrite,
  });

export const createPlaylistable = async (
  overwrite?: Partial<PlaylistableCreationAttributes>,
) =>
  await Playlistable.create({
    playlistId: overwrite?.playlistId || (await createPlaylist()).id,
    mediumId: overwrite?.mediumId || (await createMedium()).id,
    ...overwrite,
  });

export const createLabel = async (
  overwrite?: Partial<LabelCreationAttributes>,
) =>
  await Label.create({
    text: faker.lorem.word(),
    ...overwrite,
  });

export const createPerformer = async (
  overwrite?: Partial<PerformerCreationAttributes>,
) =>
  await Performer.create({
    name: faker.person.fullName(),
    thumbnail: faker.image.avatar(),
    description: faker.lorem.paragraphs(),
    ...overwrite,
  });
