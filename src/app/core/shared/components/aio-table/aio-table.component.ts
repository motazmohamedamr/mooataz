import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CurrentPageInfo } from '@metronic/layout';
import { TableBuilder } from './table.builder';
import { AioTableSortDirection, SortEvent } from '@shared/components/aio-table/types';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  fromEvent,
  of,
  Subscription,
  switchMap,
} from 'rxjs';
import { constructPermission, PERMISSIONS } from '@core/models';

@Component({
  selector: 'app-aio-table',
  templateUrl: './aio-table.component.html',
  styleUrls: ['./aio-table.component.scss'],
})
export class AioTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() title: string;
  @Input() description: string;
  @Input() customCardTitle: TemplateRef<any>;
  @Input() customActionsTemplateRef: TemplateRef<any>;
  @Input() tableComponent: BaseAioTableComponent<any>;

  @ViewChild('searchInput', { read: ElementRef<HTMLInputElement> })
  searchInput: ElementRef<HTMLInputElement>;

  tableBuilder: TableBuilder<any>;
  pageInfo: CurrentPageInfo;

  translation: any;
  searchSub: Subscription;

  constructor(private _translateService: TranslateService) {}

  ngOnInit(): void {
    this._translateService.get('general.table').subscribe((res) => {
      this.translation = res;
    });

    this.tableBuilder = this.tableComponent.tableBuilder;
    this.pageInfo = this.tableComponent.currentPageInfo;
  }

  ngAfterViewInit(): void {
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchSub = fromEvent(this.searchInput.nativeElement, 'keyup')
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((event: Event) => {
            this.search(event);
            return of();
          })
        )
        .subscribe();
    }
  }

  search(event: Event): void {
    this.tableComponent.onSearch((event.target as HTMLInputElement).value);
  }

  filter(values: any): void {
    this.tableComponent.onFilter(values);
  }

  resetFilter(): void {
    this.tableComponent.onResetFilter();
  }

  reload(): void {
    this.tableComponent.onReload();
  }

  create(): void {
    this.tableComponent.onCreate();
  }

  edit(item: any): void {
    this.tableComponent.onEdit(item);
  }

  delete(item: any): void {
    this.tableComponent.onDelete(item);
  }

  changeStatus(item: any): void {
    this.tableComponent.onChangeStatus(item);
  }

  sort(pagingOptions: PagingOptions, column: IAioTableColumn<any>): void {
    if (!column.sortable || !column.sortBy) {
      return;
    }

    // asc -> desc -> null
    let direction = AioTableSortDirection.None;

    if (pagingOptions.sortColumn === column.sortBy) {
      if (pagingOptions.ascending) {
        direction = AioTableSortDirection.Desc;
      }
    } else {
      direction = AioTableSortDirection.Asc;
    }

    this.tableComponent.onSort(new SortEvent(column.sortBy, direction));
  }

  getPaginationInfo(pagingOptions: PagingOptions): string {
    const currentPage = (pagingOptions.pageIndex || 0) + 1;
    const pageSize = pagingOptions.pageSize || 10;
    const total = pagingOptions.totalCount || 0;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return this.translation.paginationInfo
      .replace('{{start}}', start.toString())
      .replace('{{end}}', end.toString())
      .replace('{{total}}', total.toString());
  }

  getPaginationPages(pagingOptions: PagingOptions): number[] {
    const totalPages = pagingOptions.totalPages || 1;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  hasPrevPage(pagingOptions: PagingOptions): boolean {
    return (pagingOptions.pageIndex || 0) > 0;
  }

  hasNextPage(pagingOptions: PagingOptions): boolean {
    return (pagingOptions.pageIndex || 0) < (pagingOptions.totalPages || 1) - 1;
  }

  prevPage(pagingOptions: PagingOptions): void {
    const currentPage = pagingOptions.pageIndex || 1;
    this.tableComponent.onPaging(currentPage - 1);
  }

  viewPage(pagingOptions: PagingOptions, index: number): void {
    this.tableComponent.onPaging(index - 1);
  }

  nextPage(pagingOptions: PagingOptions): void {
    const currentPage = pagingOptions.pageIndex || 0;
    this.tableComponent.onPaging(currentPage + 1);
  }

  ngOnDestroy(): void {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }
  protected readonly constructPermission = constructPermission;
  protected readonly PERMISSIONS = PERMISSIONS;
}
