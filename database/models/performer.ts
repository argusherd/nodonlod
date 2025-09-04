import { Op, Optional } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Label from "./label";
import Labelable from "./labelable";
import Medium from "./medium";
import Performable from "./performable";

interface OptionalPerformerCreationAttributes {
  id: string;
  description: string;
  thumbnail: string;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformerAttributes extends OptionalPerformerCreationAttributes {
  name: string;
}

export interface PerformerCreationAttributes
  extends Optional<
    PerformerAttributes,
    keyof OptionalPerformerCreationAttributes
  > {}

@Table({ underscored: true })
export default class Performer extends Model<
  PerformerAttributes,
  PerformerCreationAttributes
> {
  static readonly supportedSort = ["createdAt", "name", "rating"];

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @AllowNull(false)
  @Column
  name: string;

  @Column
  description: string;

  @Column
  thumbnail: string;

  @Column
  rating: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Medium, {
    through: { model: () => Performable, scope: { performableType: "medium" } },
    foreignKey: "performerId",
  })
  media: Medium[];

  @BelongsToMany(() => Label, {
    through: { model: () => Labelable, scope: { labelableType: "performer" } },
    foreignKey: "labelableId",
  })
  labels: Label[];

  static async query({
    limit,
    offset,
    search,
    sort = "createdAt",
    sortBy = "desc",
  }: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: string;
    sortBy?: "asc" | "desc";
  } = {}) {
    if (!Performer.supportedSort.includes(sort)) sort = "createdAt";
    if (!["asc", "desc"].includes(sortBy.toLowerCase())) sortBy = "desc";

    return await Performer.findAndCountAll({
      limit,
      offset,
      order: [[sort, sortBy]],
      where: {
        ...(search && {
          [Op.or]: [
            { name: { [Op.substring]: search } },
            { description: { [Op.substring]: search } },
          ],
        }),
      },
    });
  }
}
