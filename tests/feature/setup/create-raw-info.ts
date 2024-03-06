import { RawPlayable, RawPlaylist } from "@/src/raw-info-extractor";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";

export const createRawPlayable = (
  overwrite: Partial<RawPlayable> = {},
): RawPlayable => ({
  _type: "video",
  age_limit: 0,
  channel: faker.person.fullName(),
  channel_id: faker.string.uuid(),
  channel_url: faker.internet.url(),
  description: faker.lorem.paragraph(),
  duration: faker.number.int({ min: 1, max: 600 }),
  id: faker.string.uuid(),
  thumbnail: faker.image.url(),
  thumbnails: [
    { id: "0", url: faker.image.url() },
    { id: "1", url: faker.image.url() },
  ],
  title: faker.internet.displayName(),
  upload_date: dayjs(faker.date.past()).format("YYYYMMDD"),
  uploader: faker.person.fullName(),
  uploader_id: faker.string.uuid(),
  uploader_url: faker.internet.url(),
  webpage_url: faker.internet.url(),
  webpage_url_domain: faker.internet.domainName(),

  ...overwrite,
});

export const createRawPlaylist = (
  overwrite: Partial<RawPlaylist> = {},
): RawPlaylist => ({
  _type: "playlist",
  description: faker.lorem.paragraph(),
  entries: [],
  id: faker.string.uuid(),
  thumbnails: [
    { id: "0", url: faker.image.url() },
    { id: "1", url: faker.image.url() },
  ],
  title: faker.music.genre(),
  webpage_url: faker.internet.url(),
  webpage_url_domain: faker.internet.domainName(),

  ...overwrite,
});
