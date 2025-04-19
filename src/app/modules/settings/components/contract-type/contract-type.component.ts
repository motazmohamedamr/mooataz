import { Component, OnDestroy, OnInit } from '@angular/core';
import { TableColumn } from 'src/app/core/shared/components/table/table-column';
import { ToastrService } from 'ngx-toastr';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import {
  ContractTypesClient,
  ContractTypeVm,
  PaginatedListOfContractTypeVm,
} from '@core/api';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { MODALS, MODULES } from '@core/models';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { ContractTypeFormComponent } from './contract-type-form/contract-type-form.component';

class ContractTypeColumn implements IAioTableColumn<ContractTypeVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: ContractTypeVm): string {
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
  selector: 'app-contract-type',
  templateUrl: './contract-type.component.html',
  styleUrl: './contract-type.component.scss',
})
export class ContractTypeComponent
  extends BaseAioTableComponent<ContractTypeVm>
  implements OnInit
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: ContractTypeVm;

  swalTranslation: any;

  constructor(
    private _contractTypeClient: ContractTypesClient,
    private _translateService: TranslateService,
    private dialog: MatDialog,
    private _toastr: ToastrService
  ) {
    super(MODULES.ContractTypes);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('ContractTypes.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<ContractTypeVm>(
      this.dataSource$,
      this.pagingOptions$
    )
      .withColumns(this._getColumns(translation))
      .canDeleteIf()
      .canEditIf();

    this.currentPageInfo = {
      title: translation.title,
      breadcrumbs: [
        {
          title: translation.title,
          path: '/multi-tenancy',
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

    this.subscription = this._contractTypeClient
      .getContractTypes(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfContractTypeVm) => {
          this.dataSource$.next(data.items || []);
          this.pagingOptions$.next(pagingOptions.update(data.pageInfo));
          menuReinitialization();
        },
        error: () => {
          this._toastr.error('Failed to fetch data');
        },
      });
  }

  onCreate(): void {
    const modal = this.dialog.open(ContractTypeFormComponent, {
      width: '70vw',
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onEdit(item: ContractTypeVm): void {
    const modal = this.dialog.open(ContractTypeFormComponent, {
      width: '70vw',
      data: { item },
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onDelete(item: ContractTypeVm): void {
    const confirmDelete = this.swalTranslation.deletion;

    Swal.fire({
      text: confirmDelete.text,
      icon: 'error',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: confirmDelete.confirmButtonText,
      cancelButtonText: confirmDelete.cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-active-light',
      },
    }).then((result: SweetAlertResult) => {
      if (result.value) {
        this._contractTypeClient.delete(item.id, environment.apiVersion).subscribe({
          next: () => {
            this._toastr.success(confirmDelete.success);
            this.fetch(this.pagingOptions$.value);
          },
          error: () => {
            this._toastr.error(confirmDelete.error);
          },
        });
      }
    });
  }

  categoryColumns: TableColumn[];

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<ContractTypeVm>;
  } {
    return {
      name: new ContractTypeColumn(translation.columns.contractTypeDetails, 'name.ar'),
    };
  }
}
