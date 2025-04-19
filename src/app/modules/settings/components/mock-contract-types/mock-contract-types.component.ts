import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { mockData, MockData } from './mock-data';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import { AioTableSortDirection, SortEvent } from '@shared/components/aio-table/types';
import { PercentageColumn } from '@shared/components/aio-table/columns/percentage.column';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { CurrentPageInfo } from '@metronic/layout';
import { AioTableSelectionAction } from '@shared/components/aio-table/actions/custom-action';
import { MultiDropDownFilter } from '@shared/components/aio-table/filters/multi-drop-down.filter';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { MODULES } from '@core/models';

class AuthorColumn implements IAioTableColumn<MockData> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: MockData): string {
    return `
    <div class="d-flex align-items-center">
        <div class="symbol symbol-45px me-5">
          <img src="${data.author.image}" alt="${data.author.name}" />
        </div>
        <div class="d-flex justify-content-start flex-column">
          <span class="text-gray-900 fw-bold text-hover-primary fs-6">${data.author.name}</span>
          <span class="text-muted fw-semibold text-muted d-block fs-7">${data.author.name}</span>
        </div>
    </div>
    `;
  }
}

class CompanyColumn implements IAioTableColumn<MockData> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: MockData): string {
    return `
    <a href="#" class="text-gray-900 fw-bold text-hover-primary d-block fs-6">${data.company.name}</a>
    <span class="text-muted fw-semibold text-muted d-block fs-7">${data.company.field}</span>
    `;
  }
}

@Component({
  selector: 'app-mock-contract-types',
  templateUrl: './mock-contract-types.component.html',
  styleUrl: './mock-contract-types.component.scss',
})
export class MockContractTypesComponent
  extends BaseAioTableComponent<MockData>
  implements OnInit
{
  constructor(private _translateService: TranslateService) {
    super(MODULES.ContractTypes);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('mock-contract-types')
    );

    const columns = {
      author: new AuthorColumn(translation.author, 'author'),
      company: new CompanyColumn(translation.company, 'company'),
      percentage: new PercentageColumn<MockData>(
        translation.percentage,
        (item) => item.progress.percentage
      ),
    };

    const actions = {
      activate: new AioTableSelectionAction<MockData>(
        'Activate',
        (item: MockData) => {
          return item.progress.percentage > 50;
        },
        (item: MockData) => {
          console.log('Activate:', item);
        }
      ),
    };

    const filters = {
      author: new MultiDropDownFilter('author', 'Author', 'Select Author', {
        '1': 'John Doe',
        '2': 'Jane Doe',
      }),
    };

    this.tableBuilder = new TableBuilder<MockData>(this.dataSource$, this.pagingOptions$)
      .withColumns(columns)
      .withSelectionActions(actions)
      .withFilters(filters)
      .canEditIf()
      .canDeleteIf((item) => item.progress.percentage < 50);

    this.currentPageInfo = {
      title: 'Mock Contract Types',
      breadcrumbs: [
        {
          title: 'Settings',
          path: '/settings',
          isActive: false,
        },
        {
          title: 'Mock Contract Types',
          path: '/settings/mock-contract-types',
          isActive: true,
        },
      ],
    };

    this.fetch();
  }

  fetch(): void {
    this.dataSource$.next(mockData);
    // this.pagingOptions$.next({
    //   sortColumn: 'author',
    //   ascending: true,
    //   pageIndex: 0,
    //   totalPages: 1,
    //   totalCount: mockData.length,
    // });
  }

  onSearch(search: string): void {
    console.log('Search:', search);
  }

  onFilter(filter: any): void {
    console.log('Filter:', filter);
  }

  onResetFilter(): void {
    console.log('Reset filter');
  }

  onReload(): void {
    console.log('Reload');
  }

  onCreate(): void {
    console.log('Create new item');
  }

  onEdit(item: MockData): void {
    console.log('Edit:', item);
  }

  onDelete(item: MockData): void {
    console.log('Delete:', item);
  }

  onSort(event: SortEvent): void {
    const data = mockData.sort((a: any, b: any) => {
      if (event.direction === AioTableSortDirection.Asc) {
        return a[event.column] > b[event.column] ? 1 : -1;
      } else if (event.direction === AioTableSortDirection.Desc) {
        return a[event.column] < b[event.column] ? 1 : -1;
      } else {
        return 0;
      }
    });

    this.dataSource$.next(
      event.direction === AioTableSortDirection.None ? mockData : data
    );

    // this.pagingOptions$.next({
    //   sortColumn:
    //     event.direction !== AioTableSortDirection.None ? event.column : undefined,
    //   ascending: event.direction === AioTableSortDirection.Asc,
    //   pageIndex: 0,
    //   totalPages: 1,
    //   totalCount: mockData.length,
    // });
    console.log('Sort column: ' + event.column + '++ Sort direction:', event.direction);
  }

  onPaging(pageIndex: number): void {
    console.log('Page index:', pageIndex);
  }
}
