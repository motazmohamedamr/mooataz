import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import {
  ContractClient,
  ContractMainDataPageVm,
  ContractStatus,
  PaginatedListOfContractMainDataPageVm,
} from '@core/api';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { environment } from '@env/environment';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES } from '@core/models';
import { TextColumn } from '@shared/components/aio-table/columns/text.column';
import {
  BadgeColumn,
  BadgeItem,
} from '@shared/components/aio-table/columns/badge.column';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { Router } from '@angular/router';
import { STEPPER_ROUTES } from '../shared/contract-stepper-routes';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Component({
  selector: 'app-contracts-table',
  templateUrl: './contracts-table.component.html',
})
export class ContractsTableComponent
  extends BaseAioTableComponent<ContractMainDataPageVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: ContractMainDataPageVm;

  swalTranslation: any;
  translation: any;

  constructor(
    private _modalService: ModalService,
    private _translateService: TranslateService,
    private _toastr: ToastrService,
    private _contractClient: ContractClient,
    private router: Router
  ) {
    super(MODULES.Clients);
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('contract.table'));

    this.tableBuilder = new TableBuilder<ContractMainDataPageVm>(
      this.dataSource$,
      this.pagingOptions$
    )
      .withColumns(this._getColumns())
      .canDeleteIf()
      .canEditIf();

    this.currentPageInfo = {
      title: this.translation.title,
      breadcrumbs: [
        {
          title: this.translation.title,
          path: '/contracts',
          isActive: true,
        },
      ],
    };

    this.fetch(this.pagingOptions$.value);
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(this.Modals.ContractsCreateUpdate);

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.ContractsCreateUpdate);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._contractClient
      .getContractsPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfContractMainDataPageVm) => {
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
    this.router.navigate([
      '/contracts/add',
      { outlets: { contractStepper: [STEPPER_ROUTES.MAIN] } },
    ]);
  }

  onEdit(item: ContractMainDataPageVm): void {
    this.router.navigate([
      `/contracts/edit/${item.id}`,
      { outlets: { contractStepper: [STEPPER_ROUTES.MAIN] } },
    ]);
  }

  onDelete(item: ContractMainDataPageVm): void {
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
        this._contractClient.deleteContract(item.id, environment.apiVersion).subscribe({
          next: () => {
            this._toastr.success(confirmDelete.success);
            this.fetch(this.pagingOptions$.value);
          },
          error: () => {},
        });
      }
    });
  }

  private _getColumns(): {
    [key: string]: IAioTableColumn<ContractMainDataPageVm>;
  } {
    const statusBadges = {
      [ContractStatus.Draft]: new BadgeItem(
        this.translation.statuses.draft,
        'badge-dark'
      ),
      [ContractStatus.Started]: new BadgeItem(
        this.translation.statuses.started,
        'badge-light-primary'
      ),
      [ContractStatus.NotStarted]: new BadgeItem(
        this.translation.statuses.notstarted,
        'badge-light'
      ),
      [ContractStatus.InitialReceipt]: new BadgeItem(
        this.translation.statuses.initialreceipt,
        'badge-light-warning'
      ),
      [ContractStatus.FinalReceipt]: new BadgeItem(
        this.translation.statuses.finalreceipt,
        'badge-light-success'
      ),
      [ContractStatus.InProgress]: new BadgeItem(
        this.translation.statuses.inprogress,
        'badge-light-warning'
      ),
      [ContractStatus.Canceled]: new BadgeItem(
        this.translation.statuses.canceled,
        'badge-light-danger'
      ),
      [ContractStatus.Finished]: new BadgeItem(
        this.translation.statuses.finished,
        'badge-light-success'
      ),
    };

    return {
      refNum: new TextColumn<ContractMainDataPageVm>(
        this.translation.columns.refNum,
        (item) => item.refNumber || this._translateService.instant('general.notExist')
      ),
      name: new TextColumn<ContractMainDataPageVm>(
        this.translation.columns.Name,
        (item) => item.name
      ),
      contractType: new TextColumn<ContractMainDataPageVm>(
        this.translation.columns.Type,
        (item) => item.contractType || '-'
      ),
      clientName: new TextColumn<ContractMainDataPageVm>(
        this.translation.columns.ClientName,
        (item) => item.clientName
      ),
      ContractDate: new TextColumn<ContractMainDataPageVm>(
        this.translation.columns.Date,
        (item) =>
          this._translateService.currentLang === 'en'
            ? item.createAt.toLocaleDateString('en-GB')
            : item.createAt.toLocaleDateString('ar-eg')
      ),
      status: new BadgeColumn<ContractMainDataPageVm>(
        this.translation.columns.status,
        (item) => item.status,
        statusBadges
      ),
    };
  }
}
