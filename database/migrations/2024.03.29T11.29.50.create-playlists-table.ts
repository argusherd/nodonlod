import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("playlists", {
    id: {
      type: DataType.UUID,
      primaryKey: true,
    },
    title: {
      type: DataType.TEXT,
      allowNull: false,
    },
    url: {
      type: DataType.TEXT,
      unique: true,
    },
    resource_id: {
      type: DataType.TEXT,
      unique: true,
    },
    domain: {
      type: DataType.STRING,
    },
    thumbnail: {
      type: DataType.TEXT,
    },
    description: {
      type: DataType.TEXT,
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
  await queryInterface.dropTable("playlists");
};
