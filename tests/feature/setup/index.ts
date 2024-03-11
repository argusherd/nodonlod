import sequelize from "@/database/connection";
import umzug from "@/database/migrator";

beforeAll(async () => {
  try {
    await umzug.up();
  } catch (error) {
    console.log(error);
  }
});

afterEach(async () => {
  jest.clearAllMocks();

  await sequelize.truncate();
});
