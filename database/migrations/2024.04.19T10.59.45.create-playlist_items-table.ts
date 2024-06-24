import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "playlist_items",
    {
      playlist_id: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          key: "id",
          model: "playlists",
        },
        onDelete: "CASCADE",
      },
      medium_id: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          key: "id",
          model: "media",
        },
        onDelete: "CASCADE",
      },
      chapter_id: {
        type: DataType.UUID,
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
        unique_playlist_medium_chapter: {
          fields: ["playlist_id", "medium_id", "chapter_id"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("playlist_items");
};
