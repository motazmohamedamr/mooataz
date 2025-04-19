import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { BaseColumn } from '@shared/components/aio-table/columns/date.column';

export class BadgeItem {
  value: string;
  color: string;

  constructor(value: string, color: string) {
    this.value = value;
    this.color = color;
  }
}

export class BadgeColumn<T> extends BaseColumn<T> {
  mapper: (item: T) => string;
  items: { [key: string]: BadgeItem };

  constructor(
    title: string,
    mapper: (item: T) => any,
    items: { [key: string]: BadgeItem }
  ) {
    super();
    this.title = title;
    this.mapper = mapper;
    this.items = items;
  }

  render(data: T): string {
    const value = this.mapper(data);
    const item = this.items[value];
    const color = item?.color || 'badge-light';
    return `
    <div class="badge ${color} fw-bold">${item?.value}</div>
    `;
  }
}
