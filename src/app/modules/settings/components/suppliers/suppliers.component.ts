import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  PaginatedListOfSupplierPageVm,
  ServiceType,
  SupplierDetailsVm,
  SuppliersClient,
  SupplierType,
} from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES, PERMISSIONS } from '@core/models';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { AioTableSelectionAction } from '@core/shared/components/aio-table/actions/custom-action';
import { BaseAioTableComponent } from '@core/shared/components/aio-table/base-aio-table.component';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import {
  BadgeColumn,
  BadgeItem,
} from '@core/shared/components/aio-table/columns/badge.column';
import { TextColumn } from '@core/shared/components/aio-table/columns/text.column';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TableBuilder } from '@core/shared/components/aio-table/table.builder';
import { TableColumn } from '@core/shared/components/table/table-column';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subscription } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { SuppliersFormComponent } from './suppliers-form/suppliers-form.component';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent
  extends BaseAioTableComponent<SupplierDetailsVm>
  implements OnInit
{
  private _supplier = inject(SuppliersClient);
  private _modalService = inject(ModalService);
  private _translateService = inject(TranslateService);
  private _handler = inject(ApiHandlerService);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _toastr = inject(ToastrService);
  private dialog = inject(MatDialog);

  subscription: Subscription;

  Modals = MODALS;

  currentItem: SupplierDetailsVm;

  categoryColumns: TableColumn[];

  swalTranslation: any;
  translation: any;

  serviceTypesTranslated: Record<string, string> = this._translateService.instant(
    'Suppliers.modal.fields.serviceType'
  );

  supplierTypesTranslated: Record<string, string> = this._translateService.instant(
    'Suppliers.modal.fields.supplierType'
  );

  constructor() {
    super(MODULES.Users);
  }

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._supplier
      .getPage(
        undefined,
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
        next: (data: PaginatedListOfSupplierPageVm) => {
          this.dataSource$.next(data.items || []);
          this.pagingOptions$.next(pagingOptions.update(data.pageInfo));
          menuReinitialization();
        },
      });
  }

  onCreate(): void {
    const modal = this.dialog.open(SuppliersFormComponent, {
      width: '70vw',
      height: '80vh',
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }
  onChangeStatus(item: SupplierDetailsVm): void {
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
          ? this._supplier.deactivate(item.id, environment.apiVersion).subscribe({
              next: () => {
                this._toastr.success(confirmChangeStatus.success);
                this.fetch(this.pagingOptions$.value);
              },
              error: () => {
                this._toastr.error(confirmChangeStatus.error);
              },
            })
          : this._supplier.activate(item.id, environment.apiVersion).subscribe({
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

  onEdit(item: SupplierDetailsVm): void {
    this.currentItem = item;
    const modal = this.dialog.open(SuppliersFormComponent, {
      width: '70vw',
      height: '80vh',
      data: { item },
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onDelete(item: SupplierDetailsVm): void {
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
        this._supplier.delete(item.id, environment.apiVersion).subscribe({
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

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('Suppliers.table')
    );
    this.translation = translation;
    const generaltranslation = await firstValueFrom(
      this._translateService.get('general')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<SupplierDetailsVm>(
      this.dataSource$,
      this.pagingOptions$
    )
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
    [key: string]: AioTableSelectionAction<SupplierDetailsVm>;
  } {
    return {
      activate: this.createAction(
        this.translation.actions.activate,
        PERMISSIONS.Suppliers.ActivateSupplier,
        (item: SupplierDetailsVm) => !item.isActive,
        (item: SupplierDetailsVm) => this._activate(item)
      ),
      deactivate: this.createAction(
        this.translation.actions.deactivate,
        PERMISSIONS.Suppliers.DeactivateSupplier,
        (item: SupplierDetailsVm) => item.isActive,
        (item: SupplierDetailsVm) => this._deactivate(item)
      ),
    };
  }

  handleModal(): void {
    const modal = this.dialog.open(SuppliersFormComponent);
  }

  private _getColumns(
    translation: any,
    generaltranslation: any
  ): {
    [key: string]: IAioTableColumn<SupplierDetailsVm>;
  } {
    const statusBadges = {
      Active: new BadgeItem(translation.columns.active, 'badge-light-success'),
      InActive: new BadgeItem(translation.columns.inActive, 'badge-light-primary'),
    };
    return {
      name: new TextColumn<SupplierDetailsVm>(
        translation.columns.name,
        (item) => item.name
      ),
      identifierNumber: new TextColumn<SupplierDetailsVm>(
        translation.columns.identifierNumber,
        (item) =>
          item.identifierNumber == null ? generaltranslation.empty : item.identifierNumber
      ),
      bank: new TextColumn<SupplierDetailsVm>(
        translation.columns.bank,
        (item) => (item as any).bankName || '-'
      ),
      isActive: new BadgeColumn<SupplierDetailsVm>(
        translation.columns.IsActive,
        (item) => (item.isActive == true ? 'Active' : 'InActive'),
        statusBadges
      ),
      serviceType: new TextColumn<SupplierDetailsVm>(
        translation.columns.serviceType.label,
        (item) => this.serviceTypesTranslated[ServiceType[item.serviceType]] || ''
      ),
      supplierType: new TextColumn<SupplierDetailsVm>(
        translation.columns.supplierType,
        (item) => this.supplierTypesTranslated[SupplierType[item.supplierType]] || ''
      ),
    };
  }

  private _activate(item: SupplierDetailsVm): void {
    this._supplier.activate(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.isActive = true;
        this._changeDetectorRef.detectChanges();
        this._toastr.success(this.translation.supplierActivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }

  private _deactivate(item: SupplierDetailsVm): void {
    this._supplier.deactivate(item.id, environment.apiVersion).subscribe({
      next: () => {
        item.isActive = false;
        this._changeDetectorRef.detectChanges();

        this._toastr.success(this.translation.supplierDeactivated);
      },
      error: (err) => this._handler.handleError(err).pushError(),
    });
  }
}
