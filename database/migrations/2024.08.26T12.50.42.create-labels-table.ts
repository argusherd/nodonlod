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
      category: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_label",
      },
      type: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_label",
      },
      content: {
        type: DataType.TEXT,
        allowNull: false,
        unique: "unique_label",
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
        unique_label: {
          fields: ["category", "type", "content"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("labels");
};
