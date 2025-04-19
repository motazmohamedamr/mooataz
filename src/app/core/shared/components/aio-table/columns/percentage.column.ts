import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';

export class PercentageColumn<T> implements IAioTableColumn<T> {
  title: string;
  mapper: (item: T) => number;

  constructor(title: string, mapper: (item: T) => number) {
    this.title = title;
    this.mapper = mapper;
  }

  render(data: T): string {
    const value = this.mapper(data);
    const color = this.getProgressColor(value);

    return `
    <div class="d-flex flex-column w-100 me-2">
        <div class="d-flex flex-stack mb-2">
          <span class="text-muted me-2 fs-7 fw-bold">${value}%</span>
        </div>
        <div class="progress h-6px w-100">
          <div class="progress-bar ${color}" role="progressbar" style="width: ${value}%" aria-valuenow="${value}"
               aria-valuemin="0" aria-valuemax="100"></div>
        </div>
    </div>
    `;
  }

  private getProgressColor(value: number): string {
    if (value < 50) {
      return 'bg-danger';
    }

    if (value < 75) {
      return 'bg-warning';
    }

    if (value < 90) {
      return 'bg-info';
    }

    return 'bg-success';
  }
}
