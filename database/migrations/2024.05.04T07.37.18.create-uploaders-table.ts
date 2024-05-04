import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "uploaders",
    {
      id: {
        type: DataType.UUID,
        primaryKey: true,
      },
      url: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_uploaders_url",
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataType.DATE,
      },
      updated_at: {
        type: DataType.DATE,
      },
    },
    {
      uniqueKeys: {
        unique_uploaders_url: {
          fields: ["url"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("uploaders");
};
