import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BanksClient,
  BanksDTO,
  BusinessType,
  PaymentOption,
  ServiceType,
  SupplierDetailsVm,
  SupplierDto,
  SuppliersClient,
  SupplierType,
} from '@core/api';
import { MODALS } from '@core/models';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom, Subscription } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { supplierIBANValidator } from './iban.validator';
import { DialogRef } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

type SupplierForm = FormGroup<{
  name: FormControl<string>;
  address: FormControl<string>;
  supplierType: FormControl<number>;
  serviceType: FormControl<number>;
  businessType: FormControl<number>;
  identifierNumber: FormControl<string>;
  phone1: FormControl<string>;
  phone2: FormControl<string>;
  mail: FormControl<string>;
  iban: FormControl<string>;
  bankId: FormControl<string>;
  isActive: FormControl<boolean>;
  paymentOption: FormControl<PaymentOption>;
}>;

type BusinessTypeList = {
  id: number;
  name: string;
}[];
type SupplierTypeList = {
  id: number;
  name: string;
}[];
type ServiceTypeList = {
  id: number;
  name: string;
}[];
type PaymentOptionList = {
  id: number;
  name: string;
}[];

@Component({
  selector: 'app-suppliers-form',
  templateUrl: './suppliers-form.component.html',
  styleUrl: './suppliers-form.component.scss',
})
export class SuppliersFormComponent implements OnInit, OnDestroy {
  @Input() item: SupplierDetailsVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  private readonly fb = inject(FormBuilder);
  private readonly _suppliersClient = inject(SuppliersClient);
  private readonly _banksClient = inject(BanksClient);
  private readonly _detectorRef = inject(ChangeDetectorRef);
  readonly translateService = inject(TranslateService);
  private readonly dialogRef = inject(DialogRef);

  banks: Signal<BanksDTO[]> = toSignal(
    this._banksClient.getBanksAll(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  protected readonly data: {
    item: SupplierDetailsVm;
  } = inject(MAT_DIALOG_DATA);

  supplierTypesTranslated: Record<string, string> = this.translateService.instant(
    'Suppliers.modal.fields.supplierType'
  );

  businessTypesTranslated: Record<string, string> = this.translateService.instant(
    'Suppliers.modal.fields.businessType'
  );

  serviceTypesTranslated: Record<string, string> = this.translateService.instant(
    'Suppliers.modal.fields.serviceType'
  );

  paymentOptionsTranslated: Record<string, string> = this.translateService.instant(
    'Suppliers.modal.fields.paymentOptions'
  );

  businessTypes: BusinessTypeList = Object.entries(BusinessType)
    .slice(Math.floor(Object.keys(BusinessType).length) / 2)
    .map((st: [string, string | BusinessType]) => {
      return {
        id: +st[1],
        name: this.businessTypesTranslated[st[0]],
      };
    });

  supplierTypes: SupplierTypeList = Object.entries(SupplierType)
    .slice(Math.floor(Object.keys(SupplierType).length) / 2)
    .map((st: [string, string | SupplierType]) => {
      return {
        id: +st[1],
        name: this.supplierTypesTranslated[st[0]],
      };
    });

  serviceTypes: ServiceTypeList = Object.entries(ServiceType)
    .slice(Math.floor(Object.keys(ServiceType).length) / 2)
    .map((st: [string, string | ServiceType]) => {
      return {
        id: +st[1],
        name: this.serviceTypesTranslated[st[0]],
      };
    });

  paymentOptions: PaymentOptionList = Object.entries(PaymentOption)
    .slice(Math.floor(Object.keys(PaymentOption).length) / 2)
    .map((st: [string, string | PaymentOption]) => {
      return {
        id: +st[1],
        name: this.paymentOptionsTranslated[st[0]],
      };
    });

  Modals = MODALS;

  form: SupplierForm;

  paymentOptionChangeSub: Subscription;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(private _translateService: TranslateService) {}

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('Suppliers.modal')
    );
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      supplierType: [0, [Validators.required]],
      serviceType: [0, [Validators.required]],
      businessType: [0, [Validators.required]],
      identifierNumber: ['', [Validators.required]],
      phone1: ['', [Validators.required]],
      phone2: [''],
      mail: [''],
      iban: [''],
      bankId: [null],
      paymentOption: [0, [Validators.required]],
      isActive: [true],
    });

    this.paymentOptionChangeSub = this.paymentOption.valueChanges.subscribe(
      (paymentOptionValue) => {
        if (paymentOptionValue === PaymentOption.Cash) {
          this.iban.clearValidators();
          this.bankId.clearValidators();
          this.iban.setValue('');
          this.iban.disable();
          this.bankId.setValue(null);
          this.bankId.disable();
        } else {
          this.bankId.enable();
          this.iban.enable();
          this.iban.setValidators([Validators.required, supplierIBANValidator()]);
          this.bankId.setValidators([Validators.required]);
        }
      }
    );

    this.getSupplier();
  }

  get name(): FormControl<string> {
    return this.form.controls.name as FormControl<string>;
  }

  get address(): FormControl<string> {
    return this.form.controls.address as FormControl<string>;
  }
  get paymentOption(): FormControl<PaymentOption> {
    return this.form.controls.paymentOption as FormControl<PaymentOption>;
  }

  get bankId(): FormControl<string> {
    return this.form.controls.bankId as FormControl<string>;
  }

  get identifierNumber(): FormControl<string> {
    return this.form.controls.identifierNumber as FormControl<string>;
  }

  get businessType(): FormControl<number> {
    return this.form.controls.businessType as FormControl<number>;
  }

  get serviceType(): FormControl<number> {
    return this.form.controls.serviceType as FormControl<number>;
  }

  get isActive(): FormControl<boolean> {
    return this.form.controls.isActive as FormControl<boolean>;
  }

  get iban(): FormControl<string> {
    return this.form.controls.iban as FormControl<string>;
  }

  get phone1(): FormControl<string> {
    return this.form.controls.phone1 as FormControl<string>;
  }

  get phone2(): FormControl<string> {
    return this.form.controls.phone2 as FormControl<string>;
  }

  get mail(): FormControl<string> {
    return this.form.controls.mail as FormControl<string>;
  }

  get supplierType(): FormControl<number> {
    return this.form.controls.supplierType as FormControl<number>;
  }

  getSupplier(): void {
    if (this.data?.item?.id) {
      this.fetching = true;
      this._suppliersClient.get(this.data.item.id, environment.apiVersion).subscribe({
        next: (response: SupplierDetailsVm) => {
          this.form.patchValue({
            name: response.name,
            bankId: response.bankId,
            address: response.address,
            phone1: response.phone1,
            phone2: response.phone2,
            mail: response.mail,
            supplierType: response.supplierType,
            businessType: response.businessType,
            iban: response.iban,
            isActive: response.isActive,
            identifierNumber: response.identifierNumber,
            paymentOption: response.paymentOption,
          });
          this.form.updateValueAndValidity();
          this._detectorRef.detectChanges();
        },
      });
    } else {
      this.form.reset();
    }
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

    const formValue = this.form.getRawValue() as SupplierDto;

    if (this.data?.item?.id) {
      const actionUpdate = this._suppliersClient.update(
        this.data?.item.id,
        environment.apiVersion,
        formValue
      );

      actionUpdate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._detectorRef.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
        });
    } else {
      const actionCreate = this._suppliersClient.create(
        environment.apiVersion,
        formValue
      );

      actionCreate
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
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
      this.dialogRef.close();
    });
  }

  get suppliertype(): typeof SupplierType {
    return SupplierType;
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
        this.form.reset();
        this.dialogRef.close();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.paymentOptionChangeSub) {
      this.paymentOptionChangeSub.unsubscribe();
    }
  }
}
