import { FindOptions } from "sequelize";

export function sortable(supportedSort: string[]) {
  return {
    sort(column: any, direction?: any): FindOptions {
      if (!supportedSort.includes(column)) column = "createdAt";
      if (!["asc", "desc"].includes(direction)) direction = "desc";

      return { order: [[column, direction]] };
    },
  };
}
