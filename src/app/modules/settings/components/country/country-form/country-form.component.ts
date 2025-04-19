import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MODALS } from '@core/models';
import { TranslateService } from '@ngx-translate/core';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { finalize } from 'rxjs/operators';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { CountriesClient, CountriesUpdateDto, CountryVm } from '@core/api';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';

type FormName = FormGroup<{
  ar: FormControl<string>;
  en: FormControl<string>;
}>;

type CountryForm = FormGroup<{
  name: FormName;
  vat: FormControl<number>;
}>;

@Component({
  selector: 'app-country-form',
  templateUrl: './country-form.component.html',
  styleUrl: './country-form.component.scss',
})
export class CountryFormComponent implements OnInit {
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  protected readonly data: {
    item: CountryVm;
  } = inject(MAT_DIALOG_DATA);

  form: CountryForm = new FormGroup({
    name: new FormGroup({
      ar: new FormControl('', [
        Validators.required,
        Validators.pattern(
          '^[\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd92-\ufdc7\ufe70-\ufefc\uFDF0-\uFDFDsdp{P}p{S}]+$'
        ),
      ]),
      en: new FormControl('', [
        Validators.required,
        Validators.pattern('^[a-zA-Zsdp{P}p{S}]+$'),
      ]),
    }),
    vat: new FormControl(0, [Validators.required, Validators.pattern('^[0-9]+$')]),
  });

  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _countriesClient: CountriesClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private dialogRef: DialogRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  get vat(): FormControl {
    return this.form.controls.vat as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('Countries.modal')
    );

    if (this.data?.item) {
      this.form.patchValue({
        name: {
          ar: this.data.item.name.ar,
          en: this.data.item.name.en,
        },
        vat: this.data.item.vat,
      });
    }

    this.form.controls.name.disable();
  }

  hasChanges(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (!this.hasChanges()) {
      this.dialogRef.close();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    const dto = new CountriesUpdateDto({
      vat: formValue.vat,
    });

    const actionUpdate = this._countriesClient.updateCountry(
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
      this.dialogRef.close();
    });
  }

  close(): void {
    if (!this.hasChanges()) {
      this.dialogRef.close();
      return;
    }

    const cancel = this.swalTranslation.cancellation;

    Swal.fire({
      text: cancel.text,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: cancel.confirmButtonText,
      cancelButtonText: cancel.cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-active-light',
      },
    }).then((result: SweetAlertResult) => {
      if (result.value) {
        this.dialogRef.close();
      }
    });
  }
}
