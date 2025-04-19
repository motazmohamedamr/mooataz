import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ContractTypeDto,
  ContractTypesClient,
  ContractTypeVm,
  LocalizedStringDto,
} from '@core/api';
import { MODALS } from '@core/models';
import { TranslateService } from '@ngx-translate/core';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { finalize, map } from 'rxjs/operators';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { DialogRef } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-contract-type-form',
  templateUrl: './contract-type-form.component.html',
  styleUrl: './contract-type-form.component.scss',
})
export class ContractTypeFormComponent implements OnInit {
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  protected readonly data: {
    item: ContractTypeVm;
  } = inject(MAT_DIALOG_DATA);

  Modals = MODALS;

  form: FormGroup;
  newLogoUri: string;

  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _contractType: ContractTypesClient,
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

  get connectionString(): FormControl {
    return this.form.get('connectionString') as FormControl;
  }

  get adminEmail(): FormControl {
    return this.form.get('adminEmail') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('ContractTypes.modal')
    );

    this.form = new FormGroup({
      name: new FormGroup({
        ar: new FormControl('', [Validators.required]),
        en: new FormControl('', [Validators.required]),
      }),
    });

    if (this.data?.item?.id) {
      this._contractType.get(this.data.item.id, environment.apiVersion).subscribe({
        next: (response: ContractTypeVm) => {
          this.form.patchValue({
            name: {
              ar: response.name.ar,
              en: response.name.en,
            },
          });
          this.form.markAsPristine();
        },
        error: (err) => this._handler.handleError(err).pushError(),
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

    const formValue = this.form.value;

    const dto = new ContractTypeDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
    });

    if (this.data?.item?.id) {
      const actionUpdate = this._contractType.update(
        this.data?.item.id,
        environment.apiVersion,
        dto
      );

      actionUpdate
        .pipe(
          finalize(() => {
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
    } else {
      const actionCreate = this._contractType
        .create(environment.apiVersion, dto)
        .pipe(map(() => {}));

      actionCreate
        .pipe(
          finalize(() => {
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
