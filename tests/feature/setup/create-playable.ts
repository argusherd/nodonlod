import Playable, {
  PlayableCreationAttributes,
} from "@/database/models/playable";
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
