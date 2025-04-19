export enum AioTableSortDirection {
  Asc = 'asc',
  Desc = 'desc',
  None = 'none',
}

export class SortEvent {
  column: string;
  direction: AioTableSortDirection;

  constructor(column: string, direction: AioTableSortDirection) {
    this.column = column;
    this.direction = direction;
  }
}
