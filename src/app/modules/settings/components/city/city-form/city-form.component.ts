import { DialogRef } from '@angular/cdk/dialog';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CitiesClient,
  CityDto,
  CityVm,
  CountriesClient,
  CountryVm,
  LocalizedStringDto,
} from '@core/api';
import { MODALS } from '@core/models';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-city-form',
  templateUrl: './city-form.component.html',
  styleUrls: ['./city-form.component.scss'],
})
export class CityFormComponent implements OnInit {
  @Input() item: CityVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();
  Modals = MODALS;
  countries = signal<CountryVm[]>([]);

  form: FormGroup;
  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  private readonly _citiesClient = inject(CitiesClient);
  private readonly _countriesClient = inject(CountriesClient);
  private readonly _translateService = inject(TranslateService);
  private readonly _handler = inject(ApiHandlerService);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(DialogRef);
  protected readonly data: {
    item: CityVm;
  } = inject(MAT_DIALOG_DATA);
  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  get countryId(): FormControl {
    return this.form.controls.countryId as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('Cities.modal'));

    this._countriesClient
      .getAllCountries(environment.apiVersion)
      .subscribe((res) => this.countries.set(res));
    this.form = new FormGroup({
      name: new FormGroup({
        ar: new FormControl(this.data?.item?.name?.ar, [
          Validators.required,
          Validators.pattern(
            '^[\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd92-\ufdc7\ufe70-\ufefc\uFDF0-\uFDFDsdp{P}p{S}]+$'
          ),
        ]),
        en: new FormControl(this.data?.item?.name?.en, [
          Validators.required,
          Validators.pattern('^[a-zA-Zsdp{P}p{S}]+$'),
        ]),
      }),
      countryId: new FormControl(this.data?.item?.country.id, [
        Validators.required,
        Validators.pattern('^[0-9]+$'),
      ]),
    });
  }
  hasChanges(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (!this.hasChanges()) {
      this.close();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    console.log(formValue);

    const dto = new CityDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
      countryId: formValue.countryId,
    });

    if (this.data?.item?.id) {
      const actionUpdate = this._citiesClient.update(
        this.data.item.id,
        environment.apiVersion,
        dto
      );

      actionUpdate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._changeDetectorRef.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
          error: (err) => {
            this._handler.handleError(err).assignValidationErrors(this.form).pushError();
          },
        });
    } else {
      const actionCreate = this._citiesClient
        .create(environment.apiVersion, dto)
        .pipe(map(() => {}));

      actionCreate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._changeDetectorRef.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
          error: (err) =>
            this._handler.handleError(err).assignValidationErrors(this.form).pushError(),
        });
    }
  }
  addedSuccessfully(): void {
    const translation = this.translation.added;

    Swal.fire({
      text: translation.text,
      icon: 'success',
      buttonsStyling: false,
      confirmButtonText: translation.confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
    }).then(() => {
      this.form.reset();
      this.output.emit();
      this.close();
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

