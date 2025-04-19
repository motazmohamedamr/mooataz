import { PageInfo } from '@core/api';
import { AioTableSortDirection, SortEvent } from '@shared/components/aio-table/types';

export class PagingOptions {
  filters?: any;
  query?: string;
  sortColumn?: string;
  ascending?: boolean;
  pageIndex?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;

  constructor(pagingOptions?: PagingOptions) {
    this.filters = structuredClone(pagingOptions?.filters) || {};
    this.query = pagingOptions?.query || '';
    this.sortColumn = pagingOptions?.sortColumn || '';
    this.ascending = pagingOptions?.ascending || true;
    this.pageIndex = pagingOptions?.pageIndex || 0;
    this.pageSize = pagingOptions?.pageSize || 10;
    this.totalPages = pagingOptions?.totalPages || 1;
    this.totalCount = pagingOptions?.totalCount || 0;
  }

  update(pageInfo: PageInfo): PagingOptions {
    const pagingOptions = new PagingOptions(this);

    pagingOptions.sortColumn = pageInfo.sortingBy;
    pagingOptions.ascending = pageInfo.ascending;
    pagingOptions.pageIndex = pageInfo.pageIndex;
    pagingOptions.totalPages = pageInfo.totalPages;
    pagingOptions.totalCount = pageInfo.totalCount;

    return pagingOptions;
  }

  search(query: string): PagingOptions {
    const pagingOptions = new PagingOptions(this);

    pagingOptions.query = query;
    pagingOptions.pageIndex = 0;

    return pagingOptions;
  }

  filter(filters: any): PagingOptions {
    const pagingOptions = new PagingOptions(this);

    pagingOptions.filters = filters;
    pagingOptions.pageIndex = 0;

    return pagingOptions;
  }

  resetFilter(): PagingOptions {
    const pagingOptions = new PagingOptions(this);

    pagingOptions.filters = {};
    pagingOptions.pageIndex = 0;

    return pagingOptions;
  }

  sort(event: SortEvent): PagingOptions {
    const sortColumn =
      event.direction !== AioTableSortDirection.None ? event.column : undefined;
    const ascending = event.direction === AioTableSortDirection.Asc;

    const pagingOptions = new PagingOptions(this);

    pagingOptions.sortColumn = sortColumn;
    pagingOptions.ascending = ascending;
    pagingOptions.pageIndex = 0;

    return pagingOptions;
  }

  paginate(pageIndex: number): PagingOptions {
    const pagingOptions = new PagingOptions(this);

    pagingOptions.pageIndex = pageIndex;

    return pagingOptions;
  }

  static default(): PagingOptions {
    return new PagingOptions();
  }
}
