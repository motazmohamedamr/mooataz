import {IAioTableColumn} from '@shared/components/aio-table/columns/aio-table-column.interface';

export class BooleanColumn<T> implements IAioTableColumn<T> {
  title: string;
  mapper: (item: T) => boolean;

  constructor(title: string, mapper: (item: T) => boolean) {
    this.title = title;
    this.mapper = mapper;
  }

  render(data: T): string {
    const value = this.mapper(data);

    // return ✅
    if (value) {
      return `
      <i class="ki-duotone ki-check-square">
        <span class="path1"></span>
        <span class="path2"></span>
      </i>
      `;
    }

    // return ❌
    return `
      <i class="ki-duotone ki-cross-square">
        <span class="path1"></span>
        <span class="path2"></span>
      </i>
      `;
  }
}
