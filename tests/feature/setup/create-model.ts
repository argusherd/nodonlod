import Chapter, { ChapterCreationAttributes } from "@/database/models/chapters";
import Playable, {
  PlayableCreationAttributes,
} from "@/database/models/playable";
import Playlist, {
  PlaylistCreationAttributes,
} from "@/database/models/playlist";
import Tag, { TagCreationAttributes } from "@/database/models/tag";
import Uploader, {
  UploaderCreationAttributes,
} from "@/database/models/uploader";
import { faker } from "@faker-js/faker";

export const createPlayable = async (
  overwrite?: Partial<PlayableCreationAttributes>,
) =>
  await Playable.create({
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

export const createTag = async (overwrite?: Partial<TagCreationAttributes>) =>
  await Tag.create({
    name: faker.lorem.slug(),
    ...overwrite,
  });

export const createChapter = async (
  overwrite?: Partial<ChapterCreationAttributes>,
) =>
  await Chapter.create({
    playableId: overwrite?.playableId || (await createPlayable()).id,
    title: faker.lorem.slug(),
    ...overwrite,
  });
