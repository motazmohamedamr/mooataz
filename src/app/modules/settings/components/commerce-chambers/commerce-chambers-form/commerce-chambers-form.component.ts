import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  CommerceChambersClient,
  CommerceChamberUpdateDto,
  CommerceChamberVm,
  LocalizedStringDto,
} from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS } from '@core/models';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom, map } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';

type FormName = FormGroup<{
  ar: FormControl<string>;
  en: FormControl<string>;
}>;

type CommerceChamberForm = FormGroup<{
  name: FormName;
}>;

@Component({
  selector: 'app-commerce-chambers-form',
  templateUrl: './commerce-chambers-form.component.html',
  styleUrl: './commerce-chambers-form.component.scss',
})
export class CommerceChambersFormComponent {
  @Input() item: CommerceChamberVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  form: CommerceChamberForm;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _commerceChambersClient: CommerceChambersClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private _modalService: ModalService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('CommerceChambers.modal')
    );

    this.form = new FormGroup({
      name: new FormGroup({
        ar: new FormControl('', [
          Validators.required,
          Validators.pattern('^[\u0621-\u064A0-9s ]+$'),
        ]),
        en: new FormControl('', [
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9s ]+$'),
        ]),
      }),
    });

    setTimeout(() => this.initializeModal(), 100);
  }

  initializeModal(): void {
    this.initialized.emit();

    const modal = this._modalService.getRawElement(
      this.Modals.CommerceChambersCreateUpdate
    );

    modal.addEventListener('shown.bs.modal', () => {
      (modal.querySelector('input[autofocus]') as HTMLInputElement)?.focus();

      if (this.item?.id) {
        this.fetching = true;
        this._commerceChambersClient
          .get(this.item.id, environment.apiVersion)
          .pipe(finalize(() => (this.fetching = false)))
          .subscribe({
            next: (response: CommerceChamberVm) => {
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
      this._modalService.get(this.Modals.tenantsCreateUpdate).hide();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    console.log(formValue);

    const dto = new CommerceChamberUpdateDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
    });

    if (this.item?.id) {
      const actionUpdate = this._commerceChambersClient.update(
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
          error: (err) =>
            this._handler.handleError(err).assignValidationErrors(this.form).pushError(),
        });
    } else {
      const actionCreate = this._commerceChambersClient
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
      this._modalService.get(this.Modals.CommerceChambersCreateUpdate).hide();
    });
  }

  close(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.CommerceChambersCreateUpdate).hide();
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
        this._modalService.get(this.Modals.CommerceChambersCreateUpdate).hide();
      }
    });
  }
}
