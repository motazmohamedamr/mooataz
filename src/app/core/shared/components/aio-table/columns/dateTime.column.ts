import { DatePipe } from '@angular/common';
import { BaseColumn } from '@shared/components/aio-table/columns/date.column';

export class DateTimeColumn<T> extends BaseColumn<T> {
  mapper: (item: T) => Date;

  constructor(title: string, mapper: (item: T) => Date) {
    super();
    this.title = title;
    this.mapper = mapper;
  }

  render(data: T): string {
    const datePipe = new DatePipe(null);
    return datePipe.transform(this.mapper(data), 'medium');
  }
}
