import { Component, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AccountsClient } from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-factor-authentication',
  templateUrl: './factor-authentication.component.html',
  styleUrls: ['./factor-authentication.component.scss'],
})
export class FactorAuthenticationComponent implements OnInit {
  secondStep = false;
  qrImage: string;
  secretKey: string;
  otp: string;
  swalTranslation: any;

  private readonly accountsClient = inject(AccountsClient);
  private readonly _translateService = inject(TranslateService);
  public readonly dialogRef = inject(MatDialogRef<FactorAuthenticationComponent>);
  constructor() {}

  async ngOnInit() {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('profile.2fa')
    );
    const x: any = {};
    this.accountsClient
      .enableTwoFactorAuthentication(environment.apiVersion, x)
      .subscribe((result) => {
        this.qrImage = result.base64;
        this.secretKey = result.secretKey;
      });
  }

  verifyOtp() {
    const request: any = {
      otp: this.otp,
      secretKey: this.secretKey,
    };
    this.accountsClient
      .verifyOtpOfTwoFactorAuthentication(environment.apiVersion, request)
      .subscribe((result) => {
        console.log('📢[factor-authentication.component.ts:37]: result: ', result.result);
        if (result.result === true) {
          this.enabledSuccessfully();
          this.close();
        } else {
          this.enabledError();
        }
      });
  }

  enabledSuccessfully() {
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
  enabledError() {
    const translation = this.swalTranslation.error;

    Swal.fire({
      title: translation.title,
      text: translation.text,
      icon: 'error',
      toast: true,
      position: 'bottom-start',
      timer: 2000,
      showConfirmButton: false,
    }).then();
  }
  close() {
    this.dialogRef.close();
  }
}
