import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { DatePipe } from '@angular/common';

export abstract class BaseColumn<T> implements IAioTableColumn<T> {
  title: string;
  cssClasses: string;
  sortable: boolean;
  sortBy: string;

  abstract render(data: T): string;

  sortableBy(sortBy: string): this {
    this.sortable = true;
    this.sortBy = sortBy;
    return this;
  }
}

export class DateColumn<T> extends BaseColumn<T> {
  locale: string;
  mapper: (item: T) => Date;

  constructor(locale: string, title: string, mapper: (item: T) => Date) {
    super();
    this.locale = locale;
    this.title = title;
    this.mapper = mapper;
  }

  render(data: T): string {
    const datePipe = new DatePipe(this.locale);

    return datePipe.transform(this.mapper(data), 'longDate');
  }
}
