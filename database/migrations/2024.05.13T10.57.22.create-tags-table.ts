import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("tags", {
    id: {
      type: DataType.UUID,
      primaryKey: true,
    },
    name: {
      type: DataType.STRING,
      unique: true,
      allowNull: false,
    },
    created_at: {
      type: DataType.DATE,
    },
    updated_at: {
      type: DataType.DATE,
    },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("tags");
};
