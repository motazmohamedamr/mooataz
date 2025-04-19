import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { CurrentPageInfo } from '@metronic/layout';
import { BehaviorSubject } from 'rxjs';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import { SortEvent } from '@shared/components/aio-table/types';
import { AioTableSelectionAction } from '@shared/components/aio-table/actions/custom-action';
import { constructPermission } from '@core/models';

export abstract class BaseAioTableComponent<T> {
  tableBuilder: TableBuilder<T>;
  currentPageInfo: CurrentPageInfo;

  dataSource$: BehaviorSubject<T[]>;
  pagingOptions$: BehaviorSubject<PagingOptions>;

  canCreate: boolean = true;

  protected constructor(public module: string) {
    this.dataSource$ = new BehaviorSubject<T[]>([]);
    this.pagingOptions$ = new BehaviorSubject<PagingOptions>(PagingOptions.default());
  }

  abstract fetch(pagingOptions?: PagingOptions): void;

  onSearch(query: string): void {
    const pagingOptions = this.pagingOptions$.value.search(query);

    this.fetch(pagingOptions);
  }

  onFilter(filter: any): void {
    const pagingOptions = this.pagingOptions$.value.filter(filter);

    this.fetch(pagingOptions);
  }

  onResetFilter(): void {
    const pagingOptions = this.pagingOptions$.value.resetFilter();

    this.fetch(pagingOptions);
  }

  onReload(): void {
    this.fetch();
  }

  abstract onCreate(): void;

  abstract onEdit(item: T): void;

  abstract onDelete(item: T): void;

  onChangeStatus(item: T): void {}

  onSort(event: SortEvent): void {
    const pagingOptions = this.pagingOptions$.value.sort(event);

    this.fetch(pagingOptions);
  }

  onPaging(pageIndex: number): void {
    const pagingOptions = this.pagingOptions$.value.paginate(pageIndex);

    this.fetch(pagingOptions);
  }

  protected createAction(
    name: string,
    permission: string,
    canExecute: (item: T) => boolean,
    execute: (item: T) => void
  ): AioTableSelectionAction<T> {
    return new AioTableSelectionAction(name, canExecute, execute).withPermission(
      constructPermission(this.module, permission)
    );
  }
}
