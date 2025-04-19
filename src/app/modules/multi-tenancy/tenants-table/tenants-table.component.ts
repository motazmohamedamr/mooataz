import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import { AioTableSelectionAction } from '@shared/components/aio-table/actions/custom-action';
import {
  PaginatedListOfTenantDashboardVm,
  TenantDashboardVm,
  TenantsClient,
  TenantStatus,
} from '@core/api';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { environment } from '@env/environment';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES, PERMISSIONS } from '@core/models';
import { TextColumn } from '@shared/components/aio-table/columns/text.column';
import {
  BadgeColumn,
  BadgeItem,
} from '@shared/components/aio-table/columns/badge.column';
import { DateColumn } from '@shared/components/aio-table/columns/date.column';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { ApiHandlerService } from '@core/services/api-handler.service';

class TenantColumn implements IAioTableColumn<TenantDashboardVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: TenantDashboardVm): string {
    return `
    <div class="d-flex align-items-center">
        <div class="symbol symbol-45px me-5">
          <img src="${data.logoUrl || './assets/media/svg/files/blank-image.svg'}" alt="${data.name}" />
        </div>
        <div class="d-flex justify-content-start flex-column">
          <span class="text-gray-900 fw-bold text-hover-primary fs-6">${data.name}</span>
          <span class="text-muted fw-semibold text-muted d-block fs-7">${data.identifier}</span>
        </div>
    </div>
    `;
  }
}

@Component({
  selector: 'app-tenants-table',
  templateUrl: './tenants-table.component.html',
})
export class TenantsTableComponent
  extends BaseAioTableComponent<TenantDashboardVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: TenantDashboardVm;

  swalTranslation: any;
  translation: any;

  constructor(
    private _tenantsClient: TenantsClient,
    private _modalService: ModalService,
    private _handler: ApiHandlerService,
    private _translateService: TranslateService,
    private _toastr: ToastrService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    super(MODULES.MultiTenancy);
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('multiTenancy.table')
    );

    this.tableBuilder = new TableBuilder<TenantDashboardVm>(
      this.dataSource$,
      this.pagingOptions$
    )
      .withColumns(this._getColumns())
      .withSelectionActions(this._createActions())
      .canEditIf();

    this.currentPageInfo = {
      title: this.translation.title,
      breadcrumbs: [
        {
          title: this.translation.title,
          path: '/multi-tenancy',
          isActive: true,
        },
      ],
    };

    this.fetch(this.pagingOptions$.value);
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(this.Modals.tenantsCreateUpdate);

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.tenantsCreateUpdate);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._tenantsClient
      .getPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfTenantDashboardVm) => {
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
    this._modalService.get(this.Modals.tenantsCreateUpdate).show();
  }

  onEdit(item: TenantDashboardVm): void {
    this.currentItem = item;
    this._modalService.get(this.Modals.tenantsCreateUpdate).show();
  }

  onDelete(item: TenantDashboardVm): void {
    console.log('Delete:', item);
  }

  private _getColumns(): {
    [key: string]: IAioTableColumn<TenantDashboardVm>;
  } {
    const statusBadges = {
      [TenantStatus.Pending]: new BadgeItem(
        this.translation.statuses.pending,
        'badge-light-warning'
      ),
      [TenantStatus.Ready]: new BadgeItem(
        this.translation.statuses.ready,
        'badge-light-primary'
      ),
      [TenantStatus.Active]: new BadgeItem(
        this.translation.statuses.active,
        'badge-light-success'
      ),
      [TenantStatus.Inactive]: new BadgeItem(
        this.translation.statuses.inactive,
        'badge-dark'
      ),
      [TenantStatus.Suspended]: new BadgeItem(
        this.translation.statuses.suspended,
        'badge-light-danger'
      ),
    };

    return {
      name: new TenantColumn(this.translation.columns.tenantDetails, 'identifier'),
      adminEmail: new TextColumn<TenantDashboardVm>(
        this.translation.columns.adminEmail,
        (item) => item.adminEmail
      ),
      status: new BadgeColumn<TenantDashboardVm>(
        this.translation.columns.status,
        (item) => item.status,
        statusBadges
      ),
      validTo: new DateColumn<TenantDashboardVm>(
        this._translateService.currentLang,
        this.translation.columns.validTo,
        (item) => item.validTo
      ).sortableBy('validTo'),
    };
  }

  private _createActions(): {
    [key: string]: AioTableSelectionAction<TenantDashboardVm>;
  } {
    return {
      activate: this.createAction(
        this.translation.actions.activate,
        PERMISSIONS.Tenants.ActivateTenant,
        (item: TenantDashboardVm) => item.status !== TenantStatus.Active,
        (item: TenantDashboardVm) => this._activate(item)
      ),
      deactivate: this.createAction(
        this.translation.actions.deactivate,
        PERMISSIONS.Tenants.DeactivateTenant,
        (item: TenantDashboardVm) => item.status !== TenantStatus.Inactive,
        (item: TenantDashboardVm) => this._deactivate(item)
      ),
    };
  }

  private _activate(item: TenantDashboardVm): void {
    this._tenantsClient.activate(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.status = TenantStatus.Active;

        this._changeDetectorRef.detectChanges();
        this._toastr.success(this.translation.tenantActivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }

  private _deactivate(item: TenantDashboardVm): void {
    this._tenantsClient.deactivate(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.status = TenantStatus.Inactive;

        this._changeDetectorRef.detectChanges();
        this._toastr.success(this.translation.tenantDeactivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }
}
