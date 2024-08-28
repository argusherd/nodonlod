import { DataType } from "sequelize-typescript";
import { Migration } from "../migrator";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable(
    "labelables",
    {
      label_id: {
        type: DataType.UUID,
        allowNull: false,
        references: { key: "id", model: "labels" },
        unique: "unique_labelables_label",
        onDelete: "CASCADE",
      },
      labelable_id: {
        type: DataType.UUID,
        allowNull: false,
        unique: "unique_labelables_label",
      },
      labelable_type: {
        type: DataType.STRING,
        allowNull: false,
        unique: "unique_labelables_label",
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
        unique_labelables_label: {
          fields: ["label_id", "labelable_id", "labelable_type"],
        },
      },
    },
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("labelables");
};
