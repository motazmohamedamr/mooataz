import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  CityVm,
  ClientDto,
  ClientsClient,
  ClientType,
  ClientVm,
  CountriesClient,
  CountryVm,
} from '@core/api';
import { MODALS } from '@core/models';
import { TranslateService } from '@ngx-translate/core';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { environment } from '@env/environment';
import { finalize, first, map, startWith, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ClientTypeOption, ClientTypesValues } from '@shared/Models/ClientType';
import { DialogRef } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

type ClientContactInfoForm = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
  phoneNumber: FormControl<string>;
  phoneNumber2: FormControl<string>;
  email: FormControl<string>;
  postalCode: FormControl<string>;
  faxNumber: FormControl<string>;
  clientId: FormControl<string>;
}>;

type ClientAddressForm = FormGroup<{
  id: FormControl<string>;
  countryId: FormControl<string>;
  cityId: FormControl<string>;
  shortAddress: FormControl<string>;
  street: FormControl<string>;
  buildingNumber: FormControl<string>;
}>;

type ClientForm = FormGroup<{
  name: FormControl<string>;
  commercialRegisterNumber: FormControl<string>;
  identification: FormControl<string>;
  isActive: FormControl<boolean>;
  type: FormControl<number>;
  address: FormGroup<any>;
  contactInfo: FormGroup<any>;
}>;

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent implements OnInit, OnDestroy {
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  countries = signal<CountryVm[]>([]);
  cities = signal<CityVm[]>([]);

  private readonly fb = inject(FormBuilder);
  private readonly _countriesClient = inject(CountriesClient);
  private readonly _detectorRef = inject(ChangeDetectorRef);
  readonly translateService = inject(TranslateService);

  protected readonly data: {
    item: ClientVm;
  } = inject(MAT_DIALOG_DATA);

  Modals = MODALS;

  form: ClientForm;
  newLogoUri: string;

  formValueSub: Subscription;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  clientTypes: ClientTypeOption[] = ClientTypesValues;

  constructor(
    private _Client: ClientsClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private dialogRef: DialogRef
  ) {}

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('Clients.modal'));
    this._countriesClient
      .getAllCountries(environment.apiVersion)
      .pipe(first())
      .subscribe((countries) => this.countries.set(countries));
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      commercialRegisterNumber: ['', [Validators.required]],
      identification: [''],
      isActive: [true],
      type: [0, [Validators.required]],
      address: this.fb.group({
        id: [''],
        buildingNumber: [null, [Validators.required]],
        cityId: ['', [Validators.required]],
        countryId: ['', [Validators.required]],
        shortAddress: ['', [Validators.required]],
        street: ['', [Validators.required]],
      }),
      contactInfo: this.fb.group({
        clientId: [''],
        email: [''],
        faxNumber: [null],
        id: [''],
        name: ['', [Validators.required]],
        phoneNumber: ['', [Validators.required]],
        phoneNumber2: [''],
        postalCode: [''],
      }),
    });

    this.formValueSub = this.type.valueChanges
      .pipe(
        tap(() => this.identification.markAsDirty()),
        startWith(this.type.value)
      )
      .subscribe((type: number) => {
        if (type.toString() === ClientType.PrivateIndividual.toString()) {
          this.identification.enable();
          this.identification.addValidators(Validators.required);
          this.commercialRegisterNumber.enable();
        } else if (type.toString() === ClientType.Governmental.toString()) {
          this.identification.clearValidators();
          this.form.patchValue({
            identification: null,
          });
          this.identification.disable();
          this.commercialRegisterNumber.clearValidators();
          this.form.patchValue({
            commercialRegisterNumber: null,
          });
          this.commercialRegisterNumber.disable();
        } else if (
          type.toString() === ClientType.SemiGovernmental.toString() ||
          type.toString() === ClientType.PrivateCompany.toString()
        ) {
          this.commercialRegisterNumber.addValidators(Validators.required);
          this.commercialRegisterNumber.enable();
          this.identification.enable();
        } else {
          this.identification.clearValidators();
          this.commercialRegisterNumber.clearValidators();
          this.identification.enable();
          this.commercialRegisterNumber.enable();
        }
        this.identification.updateValueAndValidity();
      });

    // setTimeout(() => this.initializeModal(), 100);
    this.getEditedClientData();
  }

  get name(): FormControl<string> {
    return this.form.controls.name as FormControl<string>;
  }

  get type(): FormControl<number> {
    return this.form.controls.type as FormControl<number>;
  }

  get commercialRegisterNumber(): FormControl {
    return this.form.controls.commercialRegisterNumber as FormControl;
  }

  get identification(): FormControl {
    return this.form.controls.identification as FormControl;
  }

  get isActive(): FormControl {
    return this.form.controls.isActive as FormControl;
  }

  get address(): ClientAddressForm {
    return this.form.controls.address as ClientAddressForm;
  }

  get contactInfo(): ClientContactInfoForm {
    return this.form.controls.contactInfo as ClientContactInfoForm;
  }

  countryChanged(value: string | number): void {
    this.populateCities(value as string, true);
  }

  populateCities(countryId: string, changeCity: boolean): void {
    const country: CountryVm = this.countries().find(
      (country) => country.id === countryId
    )!;
    if (!country) return;
    this.cities.set(country.cities);
    if (changeCity && country.cities.length > 0)
      this.address.get('cityId').setValue(country.cities[0].id);
  }

  hasChanges(): boolean {
    return this.form.dirty;
  }

  getEditedClientData(): void {
    if (this.data && this.data.item?.id) {
      this.fetching = true;
      this._Client
        .getClient(this.data.item.id, environment.apiVersion)
        .pipe(finalize(() => (this.fetching = false)))
        .subscribe({
          next: (response: ClientVm) => {
            this.populateCities(response.address.country?.id, false);
            this.form.patchValue({
              name: response.name,
              identification: response.identification,
              address: {
                ...response.address,
                countryId: response.address.country?.id,
                cityId: response.address.city?.id,
              },
              contactInfo: {
                ...response.contactInfo,
                clientId: this.data.item.id,
              },
              isActive: response.isActive,
              type: response.type,
              commercialRegisterNumber: response.commercialRegisterNumber,
            });
            this.form.markAsPristine();
          },
          error: (err) => this._handler.handleError(err).pushError(),
        });
    } else {
      this.form.reset();
    }
  }

  save(): void {
    if (!this.hasChanges()) {
      this.dialogRef.close();
      return;
    }

    this.loading = true;

    const formValue = this.form.value as ClientDto;

    if (this.data?.item?.id) {
      const actionUpdate = this._Client.updateClient(
        this.data.item.id,
        environment.apiVersion,
        formValue
      );

      actionUpdate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._detectorRef.detectChanges();
            this.dialogRef.close();
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
      const actionCreate = this._Client.createClient(environment.apiVersion, formValue);

      actionCreate
        .pipe(
          finalize(() => {
            this.loading = false;
            this.dialogRef.close();
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
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.formValueSub) {
      this.formValueSub.unsubscribe();
    }
  }
}
