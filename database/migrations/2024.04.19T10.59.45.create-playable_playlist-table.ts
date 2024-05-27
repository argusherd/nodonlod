import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "playable_playlist",
    {
      playable_id: {
        type: DataType.UUID,
        unique: "unique_playable_playlist_id",
        allowNull: false,
        references: {
          key: "id",
          model: "playables",
        },
        onDelete: "CASCADE",
      },
      playlist_id: {
        type: DataType.UUID,
        unique: "unique_playable_playlist_id",
        allowNull: false,
        references: {
          key: "id",
          model: "playlists",
        },
        onDelete: "CASCADE",
      },
      chapter_id: {
        type: DataType.UUID,
        unique: "unique_playable_playlist_id",
        references: {
          key: "id",
          model: "chapters",
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
    },
    {
      uniqueKeys: {
        unique_playable_playlist_id: {
          fields: ["playable_id", "playlist_id", "chapter_id"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("playable_playlist");
};
