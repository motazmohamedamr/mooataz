import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { ModalService } from '@core/interfaces/modal.service';
import {
  FileParameter,
  HttpResultOfBoolean,
  LocalizedStringDto,
  ProblemDetails,
  TenantDashboardVm,
  TenantDetailsVm,
  TenantDto,
  TenantsClient,
  TestConnectionRequest,
  ValidationProblemDetails,
} from '@core/api';
import { MODALS } from '@core/models';
import Swal from 'sweetalert2';
import { SweetAlertResult } from 'sweetalert2';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { FileManagerService } from '@core/services/file-manager.service';

@Component({
  selector: 'app-tenants-create-update',
  templateUrl: './tenants-create-update.component.html',
})
export class TenantsCreateUpdateComponent implements OnInit {
  @Input() item: TenantDashboardVm;
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  form: FormGroup;
  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;
  testingMongoDB = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _tenantsClient: TenantsClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private _modalService: ModalService,
    private _fileManager: FileManagerService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get logoUri(): string {
    return this.newLogoUri ?? this.item?.logoUrl;
  }

  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  get connectionString(): FormControl {
    return this.form.get('connectionString') as FormControl;
  }
  get mongoConnectionString(): FormControl {
    return this.form.get('mongoConnectionString') as FormControl;
  }
  
  get adminEmail(): FormControl {
    return this.form.get('adminEmail') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('multiTenancy.table.modal')
    );

    this.form = new FormGroup({
      name: new FormGroup({
        ar: new FormControl('', [Validators.required]),
        en: new FormControl('', [Validators.required]),
      }),
      logo: new FormControl(''),
      connectionString: new FormControl('', [Validators.required]),
      mongoConnectionString: new FormControl('', [Validators.required]),
      adminEmail: new FormControl('', [Validators.required, Validators.email]),
    });

    setTimeout(() => this.initializeModal(), 100);
  }

  initializeModal(): void {
    this.initialized.emit();

    const modal = this._modalService.getRawElement(this.Modals.tenantsCreateUpdate);

    modal.addEventListener('shown.bs.modal', () => {
      (modal.querySelector('input[autofocus]') as HTMLInputElement)?.focus();

      if (this.item?.id) {
        this.fetching = true;
        this._tenantsClient
          .get(this.item.id, environment.apiVersion)
          .pipe(finalize(() => (this.fetching = false)))
          .subscribe({
            next: (response: TenantDetailsVm) => {
              this.form.patchValue({
                name: {
                  ar: response.name.ar,
                  en: response.name.en,
                },
                connectionString: response.connectionString,
                adminEmail: response.adminEmail,
                mongoConnectionString: response.mongoConnectionString,
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

  changeLogo(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      this.newLogoUri = URL.createObjectURL(file);

      this._changeDetectorRef.detectChanges();

      this.form.patchValue({
        logo: file,
      });
    };

    this.form.markAsDirty();
  }

  testConnection(): void {
    const connectionString = this.connectionString.value;

    this.testing = true;

    const request = new TestConnectionRequest({
      connectionString: connectionString,
    });

    this._tenantsClient
      .testSqlConnection(environment.apiVersion, request)
      .pipe(
        finalize(() => {
          this.testing = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: (result: HttpResultOfBoolean) => {
          if (result.result) {
            const connected = this.translation.connected;

            Swal.fire({
              title: connected.title,
              icon: 'success',
              buttonsStyling: false,
              confirmButtonText: connected.confirmButtonText,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            }).then();
          } else {
            const disconnected = this.translation.disconnected;

            Swal.fire({
              title: disconnected.title,
              text: disconnected.text,
              icon: 'error',
              buttonsStyling: false,
              confirmButtonText: disconnected.confirmButtonText,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            }).then();
          }
        },
        error: (err: ProblemDetails | ValidationProblemDetails) =>
          this._handler.handleError(err).pushError(),
      });
  }

  testMongoConnection(): void {
    const connectionString = this.mongoConnectionString.value;

    this.testingMongoDB = true;

    const request = new TestConnectionRequest({
      connectionString: connectionString,
    });

    this._tenantsClient
      .testMongoConnection(environment.apiVersion, request)
      .pipe(
        finalize(() => {
          this.testingMongoDB = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: (result: HttpResultOfBoolean) => {
          if (result.result) {
            const connected = this.translation.connected;

            Swal.fire({
              title: connected.title,
              icon: 'success',
              buttonsStyling: false,
              confirmButtonText: connected.confirmButtonText,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            }).then();
          } else {
            const disconnected = this.translation.disconnected;

            Swal.fire({
              title: disconnected.title,
              text: disconnected.text,
              icon: 'error',
              buttonsStyling: false,
              confirmButtonText: disconnected.confirmButtonText,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            }).then();
          }
        },
        error: (err: ProblemDetails | ValidationProblemDetails) =>
          this._handler.handleError(err).pushError(),
      });
  }

  save(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.tenantsCreateUpdate).hide();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    const dto = new TenantDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
      connectionString: formValue.connectionString,
      adminEmail: formValue.adminEmail,
      mongoConnectionString: formValue.mongoConnectionString,
    });

    const action = this.item?.id
      ? this._tenantsClient
          .update(this.item.id, environment.apiVersion, dto)
          .pipe(map(() => this.item.id))
      : this._tenantsClient
          .create(environment.apiVersion, dto)
          .pipe(map((result) => result.tenantId));

    action
      .pipe(
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: (tenantId: string) => {
          const logo = this.form.get('logo')?.value;

          if (logo) {
            const fileParameter = { data: logo, fileName: logo.name } as FileParameter;

            this._tenantsClient
              .updateLogo(environment.apiVersion, tenantId, fileParameter)
              .subscribe({
                next: () => this.addedSuccessfully(),
                error: (err) => this._handler.handleError(err).pushError(),
              });
          } else {
            this.addedSuccessfully();
          }
        },
        error: (err) =>
          this._handler.handleError(err).assignValidationErrors(this.form).pushError(),
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
      this.output.emit();
      this._modalService.get(this.Modals.tenantsCreateUpdate).hide();
    });
  }

  close(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.tenantsCreateUpdate).hide();
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
        this._modalService.get(this.Modals.tenantsCreateUpdate).hide();
      }
    });
  }
}
