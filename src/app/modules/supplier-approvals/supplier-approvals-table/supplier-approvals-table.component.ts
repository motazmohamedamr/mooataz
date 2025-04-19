import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  PaginatedListOfSupplierApprovalRequestVm,
  SupplierApprovalRequestPhase,
  SupplierApprovalRequestStatusVm,
  SupplierApprovalRequestVm,
  SupplierApprovalsClient,
} from '@core/api';
import { IdentityManager, User } from '@core/auth/services/identity-manager.service';
import { BaseAioTableComponent } from '@core/shared/components/aio-table/base-aio-table.component';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import {
  BadgeColumn,
  BadgeItem,
} from '@core/shared/components/aio-table/columns/badge.column';
import { TextColumn } from '@core/shared/components/aio-table/columns/text.column';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TableBuilder } from '@core/shared/components/aio-table/table.builder';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { LayoutService } from '@metronic/layout';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { concatMap, firstValueFrom, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-supplier-approvals-table',
  templateUrl: './supplier-approvals-table.component.html',
  styleUrl: './supplier-approvals-table.component.scss',
})
export class SupplierApprovalsTableComponent
  extends BaseAioTableComponent<SupplierApprovalRequestVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  currentItem: SupplierApprovalRequestVm;

  swalTranslation: any;
  translation: any;

  user: User;

  constructor(
    private _translateService: TranslateService,
    private _toastr: ToastrService,
    private _supplierApprovalsClient: SupplierApprovalsClient,
    private router: Router,
    private layout: LayoutService,
    private _identityManager: IdentityManager
  ) {
    super(null);
  }

  async ngOnInit(): Promise<void> {
    // this.layout.displayToolbarSig.set(false);
    this.user = this._identityManager.getUser();
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('SupplierApproval.table')
    );

    this.tableBuilder = new TableBuilder<SupplierApprovalRequestVm>(
      this.dataSource$,
      this.pagingOptions$
    )
      .withColumns(this._getColumns())
      .canEditIf()
      .canDeleteIf();

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

  handleModal(): void {}

  ngOnDestroy(): void {
    // this.layout.displayToolbarSig.set(true);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._supplierApprovalsClient
      .getPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfSupplierApprovalRequestVm) => {
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
    this.router.navigate(['add']);
  }

  onEdit(item: SupplierApprovalRequestVm): void {
    // this.router.navigate([
    //   `/contracts/edit/${item.id}`,
    //   { outlets: { contractStepper: [STEPPER_ROUTES.MAIN] } },
    // ]);
  }

  onDelete(item: SupplierApprovalRequestVm): void {
    console.log('Delete:', item);
  }

  private _getColumns(): {
    [key: string]: IAioTableColumn<SupplierApprovalRequestVm>;
  } {
    const statusBadges = {
      [SupplierApprovalRequestStatusVm.Pending]: new BadgeItem(
        this.translation.statuses.Pending,
        'badge-light-warning'
      ),
      [SupplierApprovalRequestStatusVm.ClientRejected]: new BadgeItem(
        this.translation.statuses.ClientRejected,
        'badge-light-danger'
      ),
      [SupplierApprovalRequestStatusVm.ClientReview]: new BadgeItem(
        this.translation.statuses.ClientReview,
        'badge-light-warning'
      ),
      [SupplierApprovalRequestStatusVm.Approved]: new BadgeItem(
        this.translation.statuses.Approved,
        'badge-light-success'
      ),
      [SupplierApprovalRequestStatusVm.Rejected]: new BadgeItem(
        this.translation.statuses.Rejected,
        'badge-light-danger'
      ),
    };

    return {
      id: new TextColumn<SupplierApprovalRequestVm>(
        this.translation.id,
        (item) => item.code
      ),
      name: new TextColumn<SupplierApprovalRequestVm>(
        this.translation.projectName,
        (item) => item.projectName
      ),
      contractType: new TextColumn<SupplierApprovalRequestVm>(
        this.translation.termName,
        (item) => item.termName || '-'
      ),
      status: new BadgeColumn<SupplierApprovalRequestVm>(
        this.translation.status,
        (item) => item.status,
        statusBadges
      ),
    };
  }

  get supplierApprovalRequestPhase(): typeof SupplierApprovalRequestPhase {
    return SupplierApprovalRequestPhase;
  }
  get supplierApprovalRequestStatusVm(): typeof SupplierApprovalRequestStatusVm {
    return SupplierApprovalRequestStatusVm;
  }

  deleteRequest(request: SupplierApprovalRequestVm) {
    this._supplierApprovalsClient
      .delete(request.id, environment.apiVersion)
      .pipe(
        concatMap(() => {
          this.fetch(this.pagingOptions$.value);
          return of();
        })
      )
      .subscribe();
  }
}
