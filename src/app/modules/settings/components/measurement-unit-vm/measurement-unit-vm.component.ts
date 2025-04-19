import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TableColumn } from '@core/shared/components/table/table-column';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import {
  MeasurementUnitsClient,
  MeasurementUnitVm,
  PaginatedListOfMeasurementUnitVm,
} from '@core/api';
import { BaseAioTableComponent } from '@shared/components/aio-table/base-aio-table.component';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { firstValueFrom, Subscription } from 'rxjs';
import { MODALS, MODULES } from '@core/models';
import { ModalService } from '@core/interfaces/modal.service';
import { TranslateService } from '@ngx-translate/core';
import { TableBuilder } from '@shared/components/aio-table/table.builder';
import { TextColumn } from '@shared/components/aio-table/columns/text.column';
import Swal, { SweetAlertResult } from 'sweetalert2';

class MeasurementUnitColumn implements IAioTableColumn<MeasurementUnitVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = false;
    this.sortBy = sortBy;
  }

  render(data: MeasurementUnitVm): string {
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
  selector: 'measurement-unit-vm',
  templateUrl: './measurement-unit-vm.component.html',
  styleUrl: './measurement-unit-vm.component.scss',
})
export class MeasurementUnitVmComponent
  extends BaseAioTableComponent<MeasurementUnitVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;

  currentItem: MeasurementUnitVm;

  categoryColumns: TableColumn[];

  swalTranslation: any;

  constructor(
    private _measurementUnit: MeasurementUnitsClient,
    private _modalService: ModalService,
    private _translateService: TranslateService,
    private _toastr: ToastrService
  ) {
    super(MODULES.MeasuringUnits);
  }

  ngOnDestroy(): void {
    this._modalService.dispose(this.Modals.measurementUnitCreateUpdate);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('MeasurementUnits.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<MeasurementUnitVm>(
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

    this.subscription = this._measurementUnit
      .getMeasurementsUnits(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfMeasurementUnitVm) => {
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
    this._modalService.get(this.Modals.measurementUnitCreateUpdate).show();
  }

  onEdit(item: MeasurementUnitVm): void {
    this.currentItem = item;
    this._modalService.get(this.Modals.measurementUnitCreateUpdate).show();
  }

  onDelete(item: MeasurementUnitVm): void {
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
        this._measurementUnit.delete(item.id, environment.apiVersion).subscribe({
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
    [key: string]: IAioTableColumn<MeasurementUnitVm>;
  } {
    return {
      name: new MeasurementUnitColumn(
        translation.columns.measurementUnitDetails,
        'Name_En'
      ),
      abbreviation: new TextColumn<MeasurementUnitVm>(
        translation.columns.abbreviation,
        (item) => item.abbreviation.ar
      ),
      abbreviationEn: new TextColumn<MeasurementUnitVm>(
        translation.columns.abbreviationEn,
        (item) => item.abbreviation.en
      ),
    };
  }

  handleModal(): void {
    const modal = this._modalService.getRawElement(
      this.Modals.measurementUnitCreateUpdate
    );

    modal.addEventListener('hidden.bs.modal', () => {
      this.currentItem = null;
    });
  }
}
