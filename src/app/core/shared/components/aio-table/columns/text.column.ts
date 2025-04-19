import { BaseColumn } from '@shared/components/aio-table/columns/date.column';

export class TextColumn<T> extends BaseColumn<T> {
  mapper: (item: T) => string;

  constructor(title: string, mapper: (item: T) => string) {
    super();
    this.title = title;
    this.mapper = mapper;
  }

  render(data: T): string {
    return this.mapper(data);
  }
}
