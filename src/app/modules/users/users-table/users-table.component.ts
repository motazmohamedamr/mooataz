import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { PagingOptions } from '@shared/components/aio-table/paging.options';
import { AioTableSelectionAction } from '@shared/components/aio-table/actions/custom-action';
import {
  AccountsActivateCommand,
  AccountsClient,
  AccountsDeactivateCommand,
  AccountsEndLockoutCommand,
  AccountStatus,
  AdminVm,
  DisableTwoFactorAuthenticationCommand,
  DeactivationRequestDto,
  PaginatedListOfAdminVm,
  ResetUserPasswordCommand,
  Role,
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
import { IdentityManager, User } from '@core/auth';
import { ApiHandlerService } from '@core/services/api-handler.service';
import Swal, { SweetAlertResult } from 'sweetalert2';

class UserDetailsColumn implements IAioTableColumn<AdminVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: AdminVm): string {
    return `
    <div class="d-flex align-items-center">
        <div class="symbol symbol-45px me-5">
          <img src="${
            data.pictureUrl || './assets/media/svg/files/blank-image.svg'
          }" alt="${data.pictureUrl}" />
        </div>
        <div class="d-flex justify-content-start flex-column">
          <span class="text-gray-900 fw-bold text-hover-primary fs-6">${
            data.fullName
          }</span>
          <span class="text-muted fw-semibold text-muted d-block fs-7">${
            data.username
          }</span>
        </div>
    </div>
    `;
  }
}

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent
  extends BaseAioTableComponent<AdminVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: AdminVm;

  currentUser: User;

  swalTranslation: any;
  translation: any;
  roles: { value: Role; label: string; description: string }[];

  constructor(
    private _accountsClient: AccountsClient,
    private _identityManager: IdentityManager,
    private _handler: ApiHandlerService,
    private _modalService: ModalService,
    private _translateService: TranslateService,
    private _toastr: ToastrService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    super(MODULES.Users);
  }

  async ngOnInit(): Promise<void> {
    this.currentUser = this._identityManager.getUser();

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('users.table'));

    // convert roles of { label, description } to { value, label, description }
    this.roles = Object.values(Role)
      .filter((c) => typeof c === 'string')
      .map((k) => k.toString())
      .map((k) => {
        // lowercase first letter
        const key = k.charAt(0).toLowerCase() + k.slice(1);
        const trans = this.translation.modal.roles[key];

        return {
          value: (Role as any)[k],
          label: trans.label,
          description: trans.description,
        };
      });

    this.tableBuilder = new TableBuilder<AdminVm>(this.dataSource$, this.pagingOptions$)
      .withColumns(this._getColumns())
      .withSelectionActions(this._createActions())
      .canEditIf()
      .canDeleteIf((c) => c.username !== this.currentUser.userName);

    this.currentPageInfo = {
      title: this.translation.title,
      breadcrumbs: [
        {
          title: this.translation.title,
          path: '/users',
          isActive: true,
        },
      ],
    };

    this.fetch(this.pagingOptions$.value);
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(this.Modals.usersCreateUpdate);

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.usersCreateUpdate);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._accountsClient
      .getAdminsPage(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfAdminVm) => {
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
    this._modalService.get(this.Modals.usersCreateUpdate).show();
  }

  onEdit(item: AdminVm): void {
    this.currentItem = item;
    this._modalService.get(this.Modals.usersCreateUpdate).show();
  }

  onDelete(item: AdminVm): void {
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
        this._accountsClient.delete(item.id, environment.apiVersion).subscribe({
          next: () => {
            this._toastr.success(confirmDelete.success);
            this.fetch(this.pagingOptions$.value);
          },
          error: (err) => this._handler.handleError(err).pushError(),
        });
      }
    });
  }

  private _getColumns(): {
    [key: string]: IAioTableColumn<AdminVm>;
  } {
    const statusBadges = {
      [AccountStatus.Inactive]: new BadgeItem(
        this.translation.statuses.inactive,
        'badge-light-danger'
      ),
      [AccountStatus.Deactivated]: new BadgeItem(
        this.translation.statuses.deactivated,
        'badge-light-primary'
      ),
      [AccountStatus.Live]: new BadgeItem(
        this.translation.statuses.active,
        'badge-light-success'
      ),
    };

    return {
      name: new UserDetailsColumn(this.translation.columns.userDetails, 'username'),
      role: new TextColumn<AdminVm>(
        this.translation.columns.role,
        (item) => this.roles.find((c) => c.value === item.roles[0])?.label
      ),
      status: new BadgeColumn<AdminVm>(
        this.translation.columns.status,
        (item) => item.status,
        statusBadges
      ),
      createdAt: new DateColumn<AdminVm>(
        this._translateService.currentLang,
        this.translation.columns.createdAt,
        (item) => item.createdAt
      ).sortableBy('createdAt'),
    };
  }

  private _createActions(): {
    [key: string]: AioTableSelectionAction<AdminVm>;
  } {
    return {
      activate: this.createAction(
        this.translation.actions.activate,
        PERMISSIONS.Users.ActivateUsers,
        (item: AdminVm) => item.status === AccountStatus.Deactivated,
        (item: AdminVm) => this._activate(item)
      ),
      deactivate: this.createAction(
        this.translation.actions.deactivate,
        PERMISSIONS.Users.DeactivateUsers,
        (item: AdminVm) => item.status === AccountStatus.Live,
        (item: AdminVm) => this._deactivate(item)
      ),
      endLockout: this.createAction(
        this.translation.actions.endLockout,
        PERMISSIONS.Users.EndLockOut,
        (item: AdminVm) => item.status === AccountStatus.Live,
        (item: AdminVm) => this._endLockout(item)
      ),
      resetPassword: this.createAction(
        this.translation.actions.resetPassword,
        PERMISSIONS.Users.ResetPassword,
        (item: AdminVm) => item.username !== this.currentUser.userName,
        (item: AdminVm) => this._resetPassword(item)
      ),
      disable2fa: this.createAction(
        this.translation.actions.disable2fa,
        PERMISSIONS.Users.Reset2fa,
        (item: AdminVm) => item.status === AccountStatus.Live,
        (item: AdminVm) => this.disable2fa(item)
      ),
    };
  }

  // private _createActions(): {
  //   [key: string]: AioTableSelectionAction<AdminVm>;
  // } {
  //   return {
  //     activate: new AioTableSelectionAction<AdminVm>(
  //       this.translation.actions.activate,
  //       PERMISSIONS.Users.ActivateUsers,
  //       (item: AdminVm) => item.status === AccountStatus.Deactivated,
  //       (item: AdminVm) => this._activate(item)
  //     ),
  //     deactivate: new AioTableSelectionAction<AdminVm>(
  //       this.translation.actions.deactivate,
  //         PERMISSIONS.Users.DeactivateUsers,
  //       (item: AdminVm) => item.status === AccountStatus.Live,
  //       (item: AdminVm) => this._deactivate(item)
  //     ),
  //     endLockout: new AioTableSelectionAction<AdminVm>(
  //       this.translation.actions.endLockout,
  //       (item: AdminVm) => item.status === AccountStatus.Live,
  //       (item: AdminVm) => this._endLockout(item)
  //     ),
  //     resetPassword: new AioTableSelectionAction<AdminVm>(
  //       this.translation.actions.resetPassword,
  //       (item: AdminVm) => item.username !== this.currentUser.userName,
  //       (item: AdminVm) => this._resetPassword(item)
  //     ),
  //   };
  // }

  private _activate(item: AdminVm): void {
    this._accountsClient
      .activate(environment.apiVersion, new AccountsActivateCommand({ userId: item.id }))
      .subscribe({
        next: () => {
          item.status = AccountStatus.Live;

          this._changeDetectorRef.detectChanges();
          this._toastr.success(this.translation.userActivated);
        },
        error: (err) => this._handler.handleError(err).pushError(),
      });
  }

  private _deactivate(item: AdminVm): void {
    const request = new DeactivationRequestDto({
      userId: item.id,
      reason: this.translation.deactivationReason,
    });

    this._accountsClient
      .deactivate(
        environment.apiVersion,
        new AccountsDeactivateCommand({ data: request })
      )
      .subscribe({
        next: () => {
          item.status = AccountStatus.Deactivated;

          this._changeDetectorRef.detectChanges();
          this._toastr.success(this.translation.userDeactivated);
        },
        error: (err) => this._handler.handleError(err).pushError(),
      });
  }

  private _endLockout(item: AdminVm): void {
    this._accountsClient
      .endLockout(
        environment.apiVersion,
        new AccountsEndLockoutCommand({ userId: item.id })
      )
      .subscribe({
        next: () => {
          item.status = AccountStatus.Live;

          this._changeDetectorRef.detectChanges();
          this._toastr.success(this.translation.endLockout);
        },
        error: (err) => this._handler.handleError(err).pushError(),
      });
  }

  private _resetPassword(item: AdminVm): void {
    const resetPasswordDialog = this.translation.resetPasswordDialog;

    Swal.fire({
      title: resetPasswordDialog.title,
      text: resetPasswordDialog.text,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: resetPasswordDialog.confirmButtonText,
      cancelButtonText: resetPasswordDialog.cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-active-light',
      },
    }).then((result: SweetAlertResult) => {
      if (result.value) {
        this._accountsClient
          .resetUserPassword(
            environment.apiVersion,
            new ResetUserPasswordCommand({ userId: item.id })
          )
          .subscribe({
            next: () => {
              this._toastr.success(resetPasswordDialog.success);
              this.fetch(this.pagingOptions$.value);
            },
            error: (err) => this._handler.handleError(err).pushError(),
          });
      }
    });
  }
  private disable2fa(item: AdminVm): void {
    const disable2faDialog = this.translation.disable2fa;
    Swal.fire({
      title: disable2faDialog.title,
      text: disable2faDialog.text,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: disable2faDialog.confirmButtonText,
      cancelButtonText: disable2faDialog.cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-active-light',
      },
    }).then((result: SweetAlertResult) => {
      if (result.value) {
        this._accountsClient
          .disableTwoFactorAuthentication(
            environment.apiVersion,
            new DisableTwoFactorAuthenticationCommand({})
          )
          .subscribe({
            next: () => {
              this.fetch(this.pagingOptions$.value);
            },
            error: (err) => {
              if (err.result) this._toastr.success(disable2faDialog.success);
              this._handler.handleError(err).pushError();
            },
          });
      }
    });
  }
}
