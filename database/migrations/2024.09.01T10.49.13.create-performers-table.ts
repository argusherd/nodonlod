import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("performers", {
    id: {
      type: DataType.UUID,
      primaryKey: true,
    },
    name: {
      type: DataType.STRING,
      allowNull: false,
    },
    description: {
      type: DataType.TEXT,
    },
    thumbnail: {
      type: DataType.TEXT,
    },
    rating: {
      type: DataType.INTEGER,
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
  await queryInterface.dropTable("performers");
};
