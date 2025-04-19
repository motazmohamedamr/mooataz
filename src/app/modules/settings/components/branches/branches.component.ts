import { Component, OnDestroy, OnInit } from '@angular/core';
import { BranchPageVm, BranchesClient, PaginatedListOfBranchPageVm } from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES } from '@core/models';
import { BaseAioTableComponent } from '@core/shared/components/aio-table/base-aio-table.component';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import { TextColumn } from '@core/shared/components/aio-table/columns/text.column';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TableBuilder } from '@core/shared/components/aio-table/table.builder';
import { TableColumn } from '@core/shared/components/table/table-column';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription, firstValueFrom } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';

class BranchesColumn implements IAioTableColumn<BranchPageVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = false;
    this.sortBy = sortBy;
  }

  render(data: BranchPageVm): string {
    return `
    <div class="d-flex align-items-center">
        <div class="d-flex justify-content-start flex-column">
          <span class="text-gray-900 fw-bold text-hover-primary fs-6">${data.name}</span>
          <span class="text-muted fw-semibold text-muted d-block fs-7">${data.code}</span>
        </div>
    </div>
    `;
  }
}

@Component({
  selector: 'app-branches',
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.scss'],
})
export class BranchesComponent
  extends BaseAioTableComponent<BranchPageVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;
  Modals = MODALS;
  categoryColumns: TableColumn[];
  swalTranslation: any;
  currentItem: BranchPageVm;

  constructor(
    private _branchesClient: BranchesClient,
    private _modalService: ModalService,
    private _translateService: TranslateService,
    private _toastr: ToastrService
  ) {
    super(MODULES.Branches);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('Branches.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<BranchPageVm>(
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
    this.subscription = this._branchesClient
      .getPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfBranchPageVm) => {
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
    this._modalService.get(this.Modals.BranchesCreateUpdate).show();
  }
  onEdit(item: BranchPageVm): void {
    this.currentItem = item;
    this._modalService.get(this.Modals.BranchesCreateUpdate).show();
  }
  onDelete(item: BranchPageVm): void {
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
        this._branchesClient.delete(item.id, environment.apiVersion).subscribe({
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

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<BranchPageVm>;
  } {
    return {
      name: new BranchesColumn(translation.columns.branchDetails, 'Name_En'),
    };
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(this.Modals.BranchesCreateUpdate);

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }
  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.BranchesCreateUpdate);
  }
}

