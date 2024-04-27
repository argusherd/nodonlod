import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("playable_playlist", {
    playable_id: {
      type: DataType.UUID,
      allowNull: false,
      references: {
        key: "id",
        model: "playables",
      },
      onDelete: "CASCADE",
    },
    playlist_id: {
      type: DataType.UUID,
      allowNull: false,
      references: {
        key: "id",
        model: "playlists",
      },
      onDelete: "CASCADE",
    },
    order: {
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
  await queryInterface.dropTable("playable_playlist");
};
