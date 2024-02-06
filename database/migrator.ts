import { readdirSync, readFileSync } from "fs";
import { join, parse } from "path";
import { QueryInterface } from "sequelize";
import { RunnableMigration, SequelizeStorage, Umzug } from "umzug";
import sequelize from "./connection";

const migrationsDir = join(__dirname, "migrations");
const template = "00-template";

const migrations = readdirSync(migrationsDir)
  .filter((filename) => !filename.includes(template))
  .map((filename): RunnableMigration<QueryInterface> => {
    const migration = require(join(migrationsDir, filename));

    return {
      name: parse(filename).name,
      up: migration.up,
      down: migration.down,
    };
  });

const umzug = new Umzug({
  context: sequelize.getQueryInterface(),
  create: {
    template: (filepath) => [
      [filepath, readFileSync(join(migrationsDir, template)).toString()],
    ],
  },
  logger: console,
  migrations, // The "glob" option does not work in the dev mode, but it works fine in test and production.
  storage: new SequelizeStorage({ sequelize }),
});

if (require.main === module) {
  umzug.runAsCLI();
}

export type Migration = typeof umzug._types.migration;

export default umzug;
