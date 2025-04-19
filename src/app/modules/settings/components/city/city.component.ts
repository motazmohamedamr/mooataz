import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CitiesClient, CityVm, PaginatedListOfCityVm } from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS, MODULES } from '@core/models';
import { BaseAioTableComponent } from '@core/shared/components/aio-table/base-aio-table.component';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import { TextColumn } from '@core/shared/components/aio-table/columns/text.column';
import { PagingOptions } from '@core/shared/components/aio-table/paging.options';
import { TableBuilder } from '@core/shared/components/aio-table/table.builder';
import { environment } from '@env/environment';
import { menuReinitialization } from '@metronic/kt/kt-helpers';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription, firstValueFrom } from 'rxjs';
import { CityFormComponent } from './city-form/city-form.component';
import Swal, { SweetAlertResult } from 'sweetalert2';

class CityColumn implements IAioTableColumn<CityVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: CityVm): string {
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
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.scss'],
})
export class CityComponent extends BaseAioTableComponent<CityVm> implements OnInit {
  subscription: Subscription;
  Modals = MODALS;
  canCreate = true;
  currentItem: CityVm;
  swalTranslation: any;

  private readonly _citiesClient = inject(CitiesClient);
  private readonly _translateService = inject(TranslateService);
  private readonly _toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  constructor() {
    super(MODULES.Cities);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(this._translateService.get('Cities.table'));

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<CityVm>(this.dataSource$, this.pagingOptions$)
      .withColumns(this._getColumns(translation))
      .canDeleteIf(() => false)
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

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<CityVm>;
  } {
    return {
      name: new CityColumn(translation.columns.cityDetails, 'name.ar'),
      countryAr: new TextColumn<CityVm>(
        translation.columns.arabicCountry,
        (item) => `${item.country.name.ar.toString()}`
      ),
      countryEn: new TextColumn<CityVm>(
        translation.columns.englishCountry,
        (item) => `${item.country.name.en.toString()}`
      ),
    };
  }
  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._citiesClient
      .getCities(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfCityVm) => {
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
    const modal = this.dialog.open(CityFormComponent, {
      width: '70vw',
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }
  onEdit(item: CityVm): void {
    const modal = this.dialog.open(CityFormComponent, {
      width: '70vw',
      data: { item },
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }
  onDelete(item: CityVm): void {
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
        this._citiesClient.delete(item.id, environment.apiVersion).subscribe({
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
}

