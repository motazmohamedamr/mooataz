import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BranchDetailsVm,
  BranchDto,
  BranchPageVm,
  BranchesClient,
  LocalizedStringDto,
} from '@core/api';
import { ModalService } from '@core/interfaces/modal.service';
import { MODALS } from '@core/models';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { FileManagerService } from '@core/services/file-manager.service';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom, map } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Component({
  selector: 'app-branches-form',
  templateUrl: './branches-form.component.html',
  styleUrls: ['./branches-form.component.scss'],
})
export class BranchesFormComponent implements OnInit {
  @Input() item: BranchPageVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  form: FormGroup;
  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;
  constructor(
    private _branchesClient: BranchesClient,
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

  get descriptionAr(): FormControl {
    return this.form.get('description.ar') as FormControl;
  }

  get descriptionEn(): FormControl {
    return this.form.get('description.en') as FormControl;
  }
  get code(): FormControl {
    return this.form.get('code') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('Branches.modal'));

    this.form = new FormGroup({
      name: new FormGroup({
        ar: new FormControl('', [
          Validators.required,
          Validators.pattern(
            '^[\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd92-\ufdc7\ufe70-\ufefc\uFDF0-\uFDFDsdp{P}p{S} ]+$'
          ),
        ]),
        en: new FormControl('', [
          Validators.required,
          Validators.pattern('^[a-zA-Zsdp{P}p{S} ]+$'),
        ]),
      }),
      description: new FormGroup({
        ar: new FormControl('', [
          Validators.required,
          Validators.pattern(
            '^[\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd92-\ufdc7\ufe70-\ufefc\uFDF0-\uFDFDsdp{P}p{S} ]+$'
          ),
        ]),
        en: new FormControl('', [
          Validators.required,
          Validators.pattern('^[a-zA-Zsdp{P}p{S} ]+$'),
        ]),
      }),
      code: new FormControl('', [
        Validators.required,
        Validators.pattern('^[-a-zA-Z0-9_ ]*$'),
      ]),
    });
    setTimeout(() => this.initializeModal(), 100);
  }
  initializeModal(): void {
    this.initialized.emit();

    const modal = this._modalService.getRawElement(this.Modals.BranchesCreateUpdate);

    modal.addEventListener('shown.bs.modal', () => {
      (modal.querySelector('input[autofocus]') as HTMLInputElement)?.focus();

      if (this.item?.id) {
        this.fetching = true;
        this._branchesClient
          .get(this.item.id, environment.apiVersion)
          .pipe(finalize(() => (this.fetching = false)))
          .subscribe({
            next: (response: BranchDetailsVm) => {
              this.form.patchValue({
                name: {
                  ar: response.name.ar,
                  en: response.name.en,
                },
                description: {
                  ar: response.description.ar,
                  en: response.description.en,
                },
                code: response.code,
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
      this._modalService.get(this.Modals.BranchesCreateUpdate).hide();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    console.log(formValue);

    const dto = new BranchDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
      description: new LocalizedStringDto({
        ar: formValue.description.ar,
        en: formValue.description.en,
      }),
      code: formValue.code,
    });

    if (this.item?.id) {
      const actionUpdate = this._branchesClient.update(
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
      const actionCreate = this._branchesClient
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
      this._modalService.get(this.Modals.BranchesCreateUpdate).hide();
    });
  }
  close(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.BranchesCreateUpdate).hide();
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
        this._modalService.get(this.Modals.BranchesCreateUpdate).hide();
      }
    });
  }
}

