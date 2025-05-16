import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "media",
    {
      id: {
        type: DataType.UUID,
        primaryKey: true,
      },
      uploader_id: {
        type: DataType.UUID,
        references: {
          key: "id",
          model: "uploaders",
        },
        onDelete: "SET NULL",
      },
      url: {
        type: DataType.TEXT,
        allowNull: false,
        unique: "unique_media_url",
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
      rating: {
        type: DataType.INTEGER,
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
    },
    {
      uniqueKeys: {
        unique_media_url: {
          fields: ["url"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("media");
};
