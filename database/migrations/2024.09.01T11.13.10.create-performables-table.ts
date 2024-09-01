import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "performables",
    {
      performer_id: {
        type: DataType.UUID,
        allowNull: false,
        references: { key: "id", model: "performers" },
        unique: "unique_performerables_performer",
        onDelete: "CASCADE",
      },
      performable_id: {
        type: DataType.UUID,
        allowNull: false,
        unique: "unique_performerables_performer",
      },
      performable_type: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_performerables_performer",
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
        unique_performerables_performer: {
          fields: ["performer_id", "performable_id", "performable_type"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("performables");
};
