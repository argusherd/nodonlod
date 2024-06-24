import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("play_queues", {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medium_id: {
      type: DataType.UUID,
      allowNull: false,
      references: { key: "id", model: "media" },
      onDelete: "CASCADE",
    },
    chapter_id: {
      type: DataType.UUID,
      references: { key: "id", model: "chapters" },
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
  await queryInterface.dropTable("play_queues");
};
