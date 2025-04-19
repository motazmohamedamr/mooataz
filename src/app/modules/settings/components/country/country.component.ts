import { DialogRef } from '@angular/cdk/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  CountriesClient,
  CountryDetailsVm,
  PaginatedListOfCountryDetailsVm,
} from '@core/api';
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
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { CountryFormComponent } from './country-form/country-form.component';

class CountryColumn implements IAioTableColumn<CountryDetailsVm> {
  title: string;
  sortable?: boolean;
  sortBy?: string;

  constructor(title: string, sortBy: string) {
    this.title = title;
    this.sortable = true;
    this.sortBy = sortBy;
  }

  render(data: CountryDetailsVm): string {
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
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrl: './country.component.scss',
})
export class CountryComponent
  extends BaseAioTableComponent<CountryDetailsVm>
  implements OnInit, OnDestroy
{
  subscription: Subscription;

  Modals = MODALS;
  canCreate = true;

  currentItem: CountryDetailsVm;

  swalTranslation: any;
  constructor(
    private _countriesClient: CountriesClient,
    private dialog: MatDialog,
    private _translateService: TranslateService,
    private _toastr: ToastrService
  ) {
    super(MODULES.Countries);
  }

  async ngOnInit(): Promise<void> {
    const translation = await firstValueFrom(
      this._translateService.get('Countries.table')
    );

    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );

    this.tableBuilder = new TableBuilder<CountryDetailsVm>(
      this.dataSource$,
      this.pagingOptions$
    )
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

  fetch(pagingOptions?: PagingOptions): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (!pagingOptions) {
      pagingOptions = this.pagingOptions$.value;
    }

    this.subscription = this._countriesClient
      .getCountries(
        pagingOptions.pageSize,
        pagingOptions.pageIndex,
        pagingOptions.query,
        pagingOptions.ascending,
        pagingOptions.sortColumn,
        environment.apiVersion
      )
      .subscribe({
        next: (data: PaginatedListOfCountryDetailsVm) => {
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
    return null;
  }

  onEdit(item: CountryDetailsVm): void {
    this.currentItem = item;

    const modal = this.dialog.open(CountryFormComponent, {
      width: '70vw',
      data: { item },
    });
    modal.afterClosed().subscribe(() => this.fetch(this.pagingOptions$.value));
  }

  onDelete(item: CountryDetailsVm): void {
    return null;
  }

  categoryColumns: TableColumn[];

  private _getColumns(translation: any): {
    [key: string]: IAioTableColumn<CountryDetailsVm>;
  } {
    return {
      name: new CountryColumn(translation.columns.countryDetails, 'name.ar'),
      vat: new TextColumn<CountryDetailsVm>(
        translation.columns.VATpercentage,
        (item) => `${item.vat.toString()}%`
      ),
      iso2: new TextColumn<CountryDetailsVm>(
        translation.columns.ISO2,
        (item) => item.isO1
      ),
      iso3: new TextColumn<CountryDetailsVm>(
        translation.columns.ISO3,
        (item) => item.isO2
      ),
      countryCurrency: new TextColumn<CountryDetailsVm>(
        translation.columns.Currency,
        (item) =>
          `${
            this._translateService.currentLang === 'en'
              ? item.countryCurrency.description.en
              : item.countryCurrency.description.ar
          } (${item.countryCurrency.code})`
      ),
    };
  }

  ngOnDestroy(): void {}
}
