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
  AccountDetailsDashboardVm,
  AccountDto,
  AccountResult,
  AccountsClient,
  AccountsPostCommand,
  AccountsPutCommand,
  AdminVm,
  FullNameDto,
  Role,
} from '@core/api';
import { MODALS } from '@core/models';
import Swal from 'sweetalert2';
import { SweetAlertResult } from 'sweetalert2';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'app-users-create-update',
  templateUrl: './users-create-update.component.html',
})
export class UsersCreateUpdateComponent implements OnInit {
  @Input() item: AdminVm;
  @Input() roles: { value: Role; label: string; description: string }[];
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();

  Modals = MODALS;

  form: FormGroup;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  constructor(
    private _accountsClient: AccountsClient,
    private _translateService: TranslateService,
    private _handler: ApiHandlerService,
    private _modalService: ModalService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get firstName(): FormControl {
    return this.form.get('fullName.firstName') as FormControl;
  }

  get lastName(): FormControl {
    return this.form.get('fullName.lastName') as FormControl;
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get role(): FormControl {
    return this.form.get('role') as FormControl;
  }

  get phoneNumber(): FormControl {
    return this.form.get('phoneNumber') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('users.table.modal')
    );

    this.form = new FormGroup({
      fullName: new FormGroup({
        firstName: new FormControl('', [Validators.required]),
        lastName: new FormControl('', [Validators.required]),
      }),
      email: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
      phoneNumber: new FormControl('', []),
    });

    setTimeout(() => this.initializeModal(), 100);
  }

  initializeModal(): void {
    this.initialized.emit();

    const modal = this._modalService.getRawElement(this.Modals.usersCreateUpdate);

    modal.addEventListener('shown.bs.modal', () => {
      (modal.querySelector('input[autofocus]') as HTMLInputElement)?.focus();

      if (this.item?.id) {
        this.fetching = true;
        this._accountsClient
          .getUser(this.item.id, environment.apiVersion)
          .pipe(finalize(() => (this.fetching = false)))
          .subscribe({
            next: (response: AccountDetailsDashboardVm) => {
              this.form.patchValue({
                fullName: {
                  firstName: response.name.firstName,
                  lastName: response.name.lastName,
                },
                email: response.email,
                role: response.roles[0],
                phoneNumber: response.phoneNumber,
              });
              this.form.markAsPristine();
            },
            error: (err) => this._handler.handleError(err).pushError(),
          });
      } else {
        this.role.enable();
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
      this._modalService.get(this.Modals.usersCreateUpdate).hide();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    const dto = new AccountDto({
      fullName: new FullNameDto({
        firstName: formValue.fullName.firstName,
        lastName: formValue.fullName.lastName,
      }),
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      role: formValue.role,
    });

    const action = this.item?.id
      ? this._accountsClient
          .put(
            environment.apiVersion,
            new AccountsPutCommand({ userId: this.item.id, data: dto })
          )
          .pipe(map(() => this.item.id))
      : this._accountsClient
          .post(environment.apiVersion, new AccountsPostCommand({ data: dto }))
          .pipe(map((result: AccountResult) => result.id));

    action
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
      this._modalService.get(this.Modals.usersCreateUpdate).hide();
    });
  }

  close(): void {
    if (!this.hasChanges()) {
      this._modalService.get(this.Modals.usersCreateUpdate).hide();
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
        this._modalService.get(this.Modals.usersCreateUpdate).hide();
      }
    });
  }
}
