import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "labels",
    {
      id: {
        type: DataType.UUID,
        primaryKey: true,
      },
      category_id: {
        type: DataType.UUID,
        allowNull: false,
        references: { key: "id", model: "categories" },
        onDelete: "CASCADE",
        unique: "unique_labels_category_text",
      },
      text: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_labels_category_text",
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
        unique_labels_category_text: {
          fields: ["category_id", "text"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("labels");
};
