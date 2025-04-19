import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import {
  AccountDetailsVm,
  AccountsClient,
  ChangeEmailCommand,
  ChangePasswordCommand,
  ProfileClient,
} from '@core/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IdentityManager } from '@core/auth';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { FactorAuthenticationComponent } from './factor-authentication/factor-authentication.component';

@Component({
  selector: 'app-sign-in-method',
  templateUrl: './sign-in-method.component.html',
})
export class SignInMethodComponent implements OnInit, OnDestroy {
  @Input() userDetails: AccountDetailsVm;

  changeEmailForm: FormGroup;
  changePasswordForm: FormGroup;

  showChangeEmailForm: boolean = false;
  showChangePasswordForm: boolean = false;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean;
  private unsubscribe: Subscription[] = [];

  swalTranslation: any;
  translation: any;
  is2Fa: boolean = false;

  private readonly dialog = inject(MatDialog);
  private readonly _accountsClient = inject(AccountsClient);

  constructor(
    private _profileClient: ProfileClient,
    private _identityManager: IdentityManager,
    private _handler: ApiHandlerService,
    private _translateService: TranslateService,
    private _cdr: ChangeDetectorRef
  ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  get email(): FormControl {
    return this.changeEmailForm.get('email') as FormControl;
  }

  get currentPassword(): FormControl {
    return this.changeEmailForm.get('currentPassword') as FormControl;
  }

  get oldPassword(): FormControl {
    return this.changePasswordForm.get('oldPassword') as FormControl;
  }

  get newPassword(): FormControl {
    return this.changePasswordForm.get('newPassword') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.changePasswordForm.get('confirmPassword') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('profile'));

    this.getProfile();

    this.changeEmailForm = new FormGroup({
      email: new FormControl(this.userDetails.email, [
        Validators.required,
        Validators.email,
      ]),
      currentPassword: new FormControl('', [Validators.required]),
    });

    this.changePasswordForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
    });
  }

  getProfile() {
    this._profileClient.get(environment.apiVersion).subscribe((result) => {
      console.log('📢[sign-in-method.component.ts:89]: result: ', result);
    });
  }

  toggleEmailForm(show: boolean) {
    this.showChangeEmailForm = show;

    if (!show) {
      this.changeEmailForm.reset();
    } else {
      this.email.setValue(this.userDetails.email);
      this.togglePasswordForm(false);
    }
  }

  togglePasswordForm(show: boolean) {
    this.showChangePasswordForm = show;

    if (!show) {
      this.changePasswordForm.reset();
    } else {
      this.toggleEmailForm(false);
    }
  }

  saveEmail() {
    this.isLoading$.next(true);

    const command = new ChangeEmailCommand({
      email: this.email.value,
      currentPassword: this.currentPassword.value,
    });

    this._profileClient
      .changeEmail(environment.apiVersion, command)
      .pipe(
        finalize(() => {
          this.isLoading$.next(false);
          this._cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.updatedSuccessfully();
          this.toggleEmailForm(false);
        },
        error: (err) =>
          this._handler
            .handleError(err)
            .assignValidationErrors(this.changeEmailForm)
            .pushError(),
      });
  }

  savePassword() {
    this.isLoading$.next(true);

    const formValue = this.changePasswordForm.value;

    const command = new ChangePasswordCommand({
      oldPassword: formValue.oldPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword,
    });

    this._profileClient
      .changePassword(environment.apiVersion, command)
      .pipe(
        finalize(() => {
          this.isLoading$.next(false);
          this._cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.updatedSuccessfully();
          this.togglePasswordForm(false);

          setTimeout(() => {
            this._identityManager.forceLogout();
          }, 1000);
        },
        error: (err) =>
          this._handler
            .handleError(err)
            .assignValidationErrors(this.changePasswordForm)
            .pushError(),
      });
  }

  updatedSuccessfully(): void {
    this._identityManager.initAccount().subscribe();

    const translation = this.swalTranslation.success;

    Swal.fire({
      title: translation.title,
      text: translation.text,
      icon: 'success',
      confirmButtonText: translation.confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
    }).then();
  }
  async disable2FaSuccessfully() {
    const translation = await firstValueFrom(
      this._translateService.get('profile.2fa.disabled')
    );

    Swal.fire({
      title: translation.title,
      text: translation.text,
      icon: 'success',
      confirmButtonText: translation.confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
    }).then();
  }

  open2faDialog(): void {
    const dialogRef = this.dialog.open(FactorAuthenticationComponent, {});
  }
  disable2Fa() {
    const command: any = {};
    this._accountsClient
      .disableTwoFactorAuthentication(environment.apiVersion, command)
      .subscribe({
        error: (err) => {
          if (err.result === true) {
            this.disable2FaSuccessfully();
            this.getProfile();
            this.is2Fa = !this.is2Fa;
            this._cdr.detectChanges();
          }
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
