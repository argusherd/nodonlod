import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("labels", {
    id: {
      type: DataType.UUID,
      primaryKey: true,
    },
    category_id: {
      type: DataType.UUID,
      allowNull: false,
      references: { key: "id", model: "categories" },
      onDelete: "CASCADE",
    },
    text: {
      type: DataType.STRING,
      unique: true,
      allowNull: false,
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
  await queryInterface.dropTable("labels");
};
