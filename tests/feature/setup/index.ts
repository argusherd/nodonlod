import sequelize from "@/database/connection";
import umzug from "@/database/migrator";
import { setDatabaseLogging } from "@/electron/initialization";

beforeAll(async () => {
  setDatabaseLogging();

  try {
    await umzug.up();
  } catch (error) {
    console.log(error);
  }
});

afterEach(async () => {
  jest.clearAllMocks();
  jest.resetAllMocks();

  await sequelize.truncate();
});
