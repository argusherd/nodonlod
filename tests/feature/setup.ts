import sequelize from "@/database/connection";
import umzug from "@/database/migrator";

beforeAll(async () => {
  await umzug.up();
});

afterEach(async () => {
  await sequelize.truncate();
});
