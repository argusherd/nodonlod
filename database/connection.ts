import { Sequelize } from "sequelize-typescript";

const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: false,
  models: [__dirname + "/models/*"],
  storage: process.env.SEQUELIZE_STORAGE,
});

export default sequelize;
