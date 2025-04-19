import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MeasurementUnitVmService } from './measurement-unit-vm.service';
import {
  MeasurementUnitDto,
  MeasurementUnitsClient,
  MeasurementUnitVm,
  LocalizedStringDto,
} from '@core/api';
import { MODALS } from '@core/models';
import { TranslateService } from '@ngx-translate/core';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { ModalService } from '@core/interfaces/modal.service';
import { FileManagerService } from '@core/services/file-manager.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { finalize, map } from 'rxjs/operators';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Component({
  selector: 'app-measurement-unit-vm-form',
  templateUrl: './measurement-unit-vm-form.component.html',
  styleUrl: './measurement-unit-vm-form.component.scss',
})
export class MeasurementUnitVmFormComponent implements OnInit {
  @Input() item: MeasurementUnitVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  form: FormGroup = new FormGroup({
    name: new FormGroup({
      ar: new FormControl('', [Validators.required]),
      en: new FormControl('', [Validators.required]),
    }),
    abbreviation: new FormGroup({
      ar: new FormControl('', [Validators.required]),
      en: new FormControl('', [Validators.required]),
    }),
  });
  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _MeasurementUnit: MeasurementUnitsClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private _modalService: ModalService,
    private _fileManager: FileManagerService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  get abbreviationAr(): FormControl {
    return this.form.get('abbreviation.ar') as FormControl;
  }

  get abbreviationEn(): FormControl {
    return this.form.get('abbreviation.en') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('MeasurementUnits.modal')
    );

    setTimeout(() => this.initializeModal(), 100);
  }

  initializeModal(): void {
    this.initialized.emit();

    const modal = this._modalService.getRawElement(
      this.Modals.measurementUnitCreateUpdate
    );

    modal.addEventListener('shown.bs.modal', () => {
      (modal.querySelector('input[autofocus]') as HTMLInputElement)?.focus();

      if (this.item?.id) {
        this.fetching = true;
        this._MeasurementUnit
          .get(this.item.id, environment.apiVersion)
          .pipe(finalize(() => (this.fetching = false)))
          .subscribe({
            next: (response: MeasurementUnitVm) => {
              this.form.patchValue({
                name: {
                  ar: response.name.ar,
                  en: response.name.en,
                },
                abbreviation: {
                  ar: response.abbreviation.ar,
                  en: response.abbreviation.en,
                },
              });
              this.form.markAsPristine();
            },
            error: (err) => this._handler.handleError(err).pushError(),
          });
      } else {
        this.form.reset();
      }
    });

    modal.addEventListener('hide.bs.modal', (e) => {
      if (this.hasChanges()) {
        e.preventDefault();
        this.close();
      } else {
        this.output.emit();
        this.form.reset();
      }
    });
  }

  hasChanges(): boolean {
    return this.form.dirty;
  }
  save(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.measurementUnitCreateUpdate).hide();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    console.log(formValue);

    const dto = new MeasurementUnitDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
      abbreviation: new LocalizedStringDto({
        ar: formValue.abbreviation.ar,
        en: formValue.abbreviation.en,
      }),
    });

    if (this.item?.id) {
      const actionUpdate = this._MeasurementUnit.update(
        this.item.id,
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
      const actionCreate = this._MeasurementUnit
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
      this._modalService.get(this.Modals.measurementUnitCreateUpdate).hide();
    });
  }

  close(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.measurementUnitCreateUpdate).hide();
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
        this._modalService.get(this.Modals.measurementUnitCreateUpdate).hide();
      }
    });
  }
}
