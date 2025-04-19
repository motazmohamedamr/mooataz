import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IPageInfo, IProjectQuantityVm, ProjectQuantityStatus } from '@core/api';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import { AioTableSortDirection } from '@core/shared/components/aio-table/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-list-table',
  templateUrl: './list-table.component.html',
  styleUrls: ['./list-table.component.scss'],
})
export class ListTableComponent implements OnInit, OnChanges {
  @Input() quantities: any;
  @Input() translation: any;
  @Input() pagingOptions: IPageInfo;
  @Output() selectTermEvent: EventEmitter<IProjectQuantityVm> =
    new EventEmitter<IProjectQuantityVm>();
  @Output() refreshQuantities = new EventEmitter<{
    ascending: boolean;
    sortingBy: string;
  }>();
  projectQuantityStatus = ProjectQuantityStatus;
  protected readonly _translateService = inject(TranslateService);
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  projectId: string;

  tableColums: IAioTableColumn<IProjectQuantityVm>[] = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.tableColums = [
        {
          title: this.translation?.itemNumber?.label,
          sortable: false,
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.title?.label,
          sortable: false,
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.description?.label,
          sortable: false,
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.specifications?.label,
          sortable: false,
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.measurementUnitId?.label,
          sortable: false,
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.quantity?.label,
          sortable: true,
          sortBy: 'quantity',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.unitPrice?.label,
          sortable: true,
          sortBy: 'unitPrice',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.totalPrice?.label,
          sortable: true,
          sortBy: 'totalPrice',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.totalWithVAT,
          sortable: true,
          sortBy: 'totalPriceWithVat',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.actualValue,
          sortable: true,
          sortBy: 'actualValue',
          render(data) {
            return '';
          },
        },
      ];
    }
  }

  async ngOnInit() {
    this.projectId = this.route.snapshot.params.id;
  }

  goAndFilterByTasks(quantity: IProjectQuantityVm) {
    this.selectTermEvent.emit(quantity);
  }

  sort(pagingOptions: IPageInfo, column: IAioTableColumn<any>): void {
    if (!column.sortable || !column.sortBy) {
      return;
    }

    // asc -> desc -> null
    let direction = AioTableSortDirection.None;

    if (pagingOptions.sortingBy === column.sortBy) {
      if (pagingOptions.ascending) {
        direction = AioTableSortDirection.Desc;
      }
    } else {
      direction = AioTableSortDirection.Asc;
    }

    this.refreshQuantities.emit({
      ascending: direction === AioTableSortDirection.Asc,
      sortingBy: column.sortBy,
    });
  }
}
