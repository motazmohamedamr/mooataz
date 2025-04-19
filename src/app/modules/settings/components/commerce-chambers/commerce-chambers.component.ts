import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  CommerceChambersClient,
  CommerceChamberVm,
  PaginatedListOfCommerceChamberVm,
} from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES } from '@core/models';
import { BaseAioTableComponent } from '@core/shared/components/aio-table/base-aio-table.component';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TableBuilder } from '@core/shared/components/aio-table/table.builder';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subscription } from 'rxjs';

class CommerceChamberColumn implements IAioTableColumn<CommerceChamberVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: CommerceChamberVm): string {
    return `
    <div class="d-flex align-items-center">
        <div class="d-flex justify-content-start flex-column">
          <span class="text-gray-900 fw-bold text-hover-primary fs-6">${data.name.ar}</span>
          <span class="text-muted fw-semibold text-muted d-block fs-7">${data.name.en}</span>
        </div>
    </div>
    `;
  }
}

@Component({
  selector: 'app-commerce-chambers',
  templateUrl: './commerce-chambers.component.html',
  styleUrl: './commerce-chambers.component.scss',
})
export class CommerceChambersComponent
  extends BaseAioTableComponent<CommerceChamberVm>
  implements OnInit, OnDestroy
{
  private readonly _translateService = inject(TranslateService);
  private readonly _modalService = inject(ModalService);
  private readonly _toastr = inject(ToastrService);
  private readonly _commerceChambersClient = inject(CommerceChambersClient);

  Modals = MODALS;
  subscription: Subscription;

  currentItem: CommerceChamberVm;

  swalTranslation: any;

  constructor() {
    super(MODULES.Countries);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('CommerceChambers.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<CommerceChamberVm>(
      this.dataSource$,
      this.pagingOptions$
    )
      .withColumns(this._getColumns(translation))
      .canEditIf();

    this.currentPageInfo = {
      title: translation.title,
      breadcrumbs: [
        {
          title: translation.title,
          path: '/commerce-chambers',
          isActive: true,
        },
      ],
    };

    this.fetch(this.pagingOptions$.value);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._commerceChambersClient
      .getPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfCommerceChamberVm) => {
          this.dataSource$.next(data.items || []);
          this.pagingOptions$.next(pagingOptions.update(data.pageInfo));
          menuReinitialization();
        },
        error: () => {
          this._toastr.error('Failed to fetch data');
        },
      });
  }

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<CommerceChamberVm>;
  } {
    return {
      name: new CommerceChamberColumn(
        translation.columns.commerceChamberDetails,
        'name.ar'
      ),
    };
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(
      this.Modals.CommerceChambersCreateUpdate
    );

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }

  onCreate(): void {
    this._modalService.get(this.Modals.CommerceChambersCreateUpdate).show();
  }

  onEdit(item: CommerceChamberVm): void {
    this.currentItem = item;
    this._modalService.get(this.Modals.CommerceChambersCreateUpdate).show();
  }

  onDelete(item: CommerceChamberVm): void {
    return null;
  }

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.CommerceChambersCreateUpdate);
  }
}

