import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "playlists",
    {
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
        unique: "unique_playlists_url_resource_id",
      },
      resource_id: {
        type: DataType.TEXT,
        unique: "unique_playlists_url_resource_id",
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
    },
    {
      uniqueKeys: {
        unique_playlists_url_resource_id: {
          fields: ["url", "resource_id"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("playlists");
};
