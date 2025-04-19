import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { ClientsClient, ClientVm, PaginatedListOfClientVm } from '@core/api';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { firstValueFrom, Subscription } from 'rxjs';
import { MODALS, MODULES, PERMISSIONS } from '@core/models';
import { TableColumn } from '@shared/components/table/table-column';
import { ModalService } from '@core/interfaces/modal.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { TextColumn } from '@shared/components/aio-table/columns/text.column';
import { ClientTypeOption, ClientTypesValues } from '@shared/Models/ClientType';
import {
  BadgeColumn,
  BadgeItem,
} from '@shared/components/aio-table/columns/badge.column';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { AioTableSelectionAction } from '@core/shared/components/aio-table/actions/custom-action';
import { MatDialog } from '@angular/material/dialog';
import { ClientFormComponent } from './client-form/client-form.component';

class ClientNameColumn implements IAioTableColumn<ClientVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: ClientVm): string {
    return `
    <div class="d-flex align-items-center">
        <div class="d-flex justify-content-start flex-column">
         <span class="text-gray-900 fw-bold text-hover-primary fs-6">${data.name}</span>
        </div>
    </div>
    `;
  }
}

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrl: './client.component.scss',
})
export class ClientComponent
  extends BaseAioTableComponent<ClientVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: ClientVm;

  categoryColumns: TableColumn[];

  swalTranslation: any;
  translation: any;

  clientTypes: ClientTypeOption[] = ClientTypesValues;
  constructor(
    private _Client: ClientsClient,
    private _modalService: ModalService,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _toastr: ToastrService,
    private dialog: MatDialog
  ) {
    super(MODULES.Clients);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._Client
      .getClients(
        undefined,
        undefined,
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn || undefined,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfClientVm) => {
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
    // this._modalService.get(this.Modals.clientCreateUpdate).show();
    const modal = this.dialog.open(ClientFormComponent, {
      width: '70vw',
      height: '80vh',
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }
  onChangeStatus(item: ClientVm): void {
    const confirmChangeStatus = this.swalTranslation.changeStatus;

    Swal.fire({
      text: confirmChangeStatus.text,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: confirmChangeStatus.confirmButtonText,
      cancelButtonText: confirmChangeStatus.cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-active-light',
      },
    }).then((result: SweetAlertResult) => {
      if (result.value) {
        item.isActive == true
          ? this._Client.deactivateClient(item.id, environment.apiVersion).subscribe({
              next: () => {
                this._toastr.success(confirmChangeStatus.success);
                this.fetch(this.pagingOptions$.value);
              },
              error: () => {
                this._toastr.error(confirmChangeStatus.error);
              },
            })
          : this._Client.activateClient(item.id, environment.apiVersion).subscribe({
              next: () => {
                this._toastr.success(confirmChangeStatus.success);
                this.fetch(this.pagingOptions$.value);
              },
              error: () => {
                this._toastr.error(confirmChangeStatus.error);
              },
            });
      }
    });
  }

  onEdit(item: ClientVm): void {
    this.currentItem = item;
    const modal = this.dialog.open(ClientFormComponent, {
      width: '70vw',
      height: '80vh',
      data: { item },
    });

    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onDelete(item: ClientVm): void {
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
        this._Client.deleteClient(item.id, environment.apiVersion).subscribe({
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

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.clientCreateUpdate);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(this._translateService.get('Clients.table'));
    this.translation = translation;
    const generaltranslation = await firstValueFrom(
      this._translateService.get('general')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<ClientVm>(this.dataSource$, this.pagingOptions$)
      .withColumns(this._getColumns(translation, generaltranslation))
      .withSelectionActions(this._createActions())
      .canChangeStatusIf()
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

  private _createActions(): {
    [key: string]: AioTableSelectionAction<ClientVm>;
  } {
    return {
      activate: this.createAction(
        this.translation.actions.activate,
        PERMISSIONS.Clients.ActivateClient,
        (item: ClientVm) => !item.isActive,
        (item: ClientVm) => this._activate(item)
      ),
      deactivate: this.createAction(
        this.translation.actions.deactivate,
        PERMISSIONS.Clients.DeactivateClient,
        (item: ClientVm) => item.isActive,
        (item: ClientVm) => this._deactivate(item)
      ),
    };
  }

  handleModal(): void {
    const modal = this.dialog.open(ClientFormComponent);

    // modal.addEventListener('hidden.bs.modal', () => {
    //   this.currentItem = null;
    // });
  }

  private _getColumns(
    translation: any,
    generaltranslation: any
  ): {
    [key: string]: IAioTableColumn<ClientVm>;
  } {
    const statusBadges = {
      Active: new BadgeItem(translation.columns.active, 'badge-light-success'),
      InActive: new BadgeItem(translation.columns.inActive, 'badge-light-primary'),
    };
    return {
      name: new ClientNameColumn(translation.columns.Name, 'name'),
      commercialRegisterNumber: new TextColumn<ClientVm>(
        translation.columns.CommercialRegisterNumber,
        (item) =>
          item.commercialRegisterNumber == null
            ? generaltranslation.empty
            : item.commercialRegisterNumber
      ),
      identification: new TextColumn<ClientVm>(
        translation.columns.Identification,
        (item) =>
          item.identification == null ? generaltranslation.empty : item.identification
      ),
      isActive: new BadgeColumn<ClientVm>(
        translation.columns.status,
        (item) => (item.isActive == true ? 'Active' : 'InActive'),
        statusBadges
      ),
      type: new TextColumn<ClientVm>(translation.columns.Type, (item) =>
        this.getClientType(item.type)
      ),
    };
  }

  private _activate(item: ClientVm): void {
    this._Client.activateClient(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.isActive = true;
        this._changeDetectorRef.detectChanges();
        this._toastr.success(this.translation.clientActivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }

  private _deactivate(item: ClientVm): void {
    this._Client.deactivateClient(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.isActive = false;
        this._changeDetectorRef.detectChanges();

        this._toastr.success(this.translation.clientDeactivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }

  private getClientType(type: number): string {
    return this.clientTypes[type].displayName.en;
  }
}
