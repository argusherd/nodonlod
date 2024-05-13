import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "taggables",
    {
      tag_id: {
        type: DataType.UUID,
        allowNull: false,
        unique: "unique_taggables_tag",
        references: {
          key: "id",
          model: "tags",
        },
        onDelete: "CASCADE",
      },
      taggable_id: {
        type: DataType.UUID,
        allowNull: false,
        unique: "unique_taggables_tag",
      },
      taggable_type: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_taggables_tag",
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
        unique_taggables_tag: {
          fields: ["tag_id", "taggable_id", "taggable_type"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("taggables");
};
