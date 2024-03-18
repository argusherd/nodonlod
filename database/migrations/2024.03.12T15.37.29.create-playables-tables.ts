import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("playables", {
    id: {
      type: DataType.UUID,
      primaryKey: true,
    },
    url: {
      type: DataType.TEXT,
      allowNull: false,
    },
    resource_id: {
      type: DataType.TEXT,
      allowNull: false,
    },
    domain: {
      type: DataType.STRING,
      allowNull: false,
    },
    title: {
      type: DataType.TEXT,
      allowNull: false,
    },
    duration: {
      type: DataType.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataType.TEXT,
    },
    thumbnail: {
      type: DataType.TEXT,
    },
    age_limit: {
      type: DataType.INTEGER,
      defaultValue: 0,
    },
    upload_date: {
      type: DataType.DATEONLY,
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
  await queryInterface.dropTable("playables");
};
