import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "chapters",
    {
      id: {
        type: DataType.UUID,
        primaryKey: true,
      },
      medium_id: {
        type: DataType.UUID,
        allowNull: false,
        unique: "unique_chapters_start_end_time",
        references: {
          key: "id",
          model: "media",
        },
        onDelete: "CASCADE",
      },
      title: {
        type: DataType.STRING,
        allowNull: false,
      },
      start_time: {
        type: DataType.NUMBER,
        unique: "unique_chapters_start_end_time",
      },
      end_time: {
        type: DataType.NUMBER,
        unique: "unique_chapters_start_end_time",
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
        unique_chapters_start_end_time: {
          fields: ["medium_id", "start_time", "end_time"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("chapters");
};
