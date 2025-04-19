import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialVm, MaterialsClient, PaginatedListOfMaterialVm } from '@core/api';
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
import { MaterialsFormComponent } from './materials-form/materials-form.component';

class MaterialColumn implements IAioTableColumn<MaterialVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = false;
    this.sortBy = sortBy;
  }

  render(data: MaterialVm): string {
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
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss'],
})
export class MaterialsComponent
  extends BaseAioTableComponent<MaterialVm>
  implements OnInit
{
  Modals = MODALS;
  subscription: Subscription;
  currentItem: MaterialVm;
  categoryColumns: TableColumn[];
  swalTranslation: any;

  private readonly _materialsClient = inject(MaterialsClient);
  private readonly _translateService = inject(TranslateService);
  private readonly _toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  constructor() {
    super(MODULES.MeasuringUnits);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('Materials.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<MaterialVm>(
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
          path: '/materials',
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

    this.subscription = this._materialsClient
      .getMaterials(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfMaterialVm) => {
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
    const modal = this.dialog.open(MaterialsFormComponent, {
      width: '70vw',
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onEdit(item: MaterialVm): void {
    const modal = this.dialog.open(MaterialsFormComponent, {
      width: '70vw',
      data: { item },
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onDelete(item: MaterialVm): void {
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
        this._materialsClient.delete(item.id, environment.apiVersion).subscribe({
          next: () => {
            this._toastr.success(confirmDelete.success);
            this.fetch(this.pagingOptions$.value);
          },
        });
      }
    });
  }

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<MaterialVm>;
  } {
    return {
      name: new MaterialColumn(translation.columns.materialsDetails, 'Name_En'),
      description: new TextColumn<MaterialVm>(
        translation.columns.description,
        (item) => item.description
      ),
      measurementUnit: new TextColumn<MaterialVm>(
        translation.columns.measurementUnit,
        (item) => item.measurementUnits.map((m) => m.name.ar).join(' - ')
      ),
      measurementUnitEn: new TextColumn<MaterialVm>(
        translation.columns.measurementUnitEn,
        (item) => item.measurementUnits.map((m) => m.name.en).join(' - ')
      ),
    };
  }
}
