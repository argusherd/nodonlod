import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("extractions", {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataType.STRING,
      allowNull: false,
    },
    resource_id: {
      type: DataType.STRING,
    },
    content: {
      type: DataType.TEXT,
    },
    error: {
      type: DataType.TEXT,
    },
    is_processing: {
      type: DataType.BOOLEAN,
      defaultValue: false,
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
  await queryInterface.dropTable("extractions");
};
