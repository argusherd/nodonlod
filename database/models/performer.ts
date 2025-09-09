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
  Scopes,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { sortable } from "../scopes";
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

@Scopes(() => ({
  ...sortable(Performer.supportedSort),
  search: (value) => ({
    where: {
      ...(value && {
        [Op.or]: [
          { name: { [Op.substring]: value } },
          { description: { [Op.substring]: value } },
        ],
      }),
    },
  }),
}))
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
}
