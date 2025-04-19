import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthResult, IdentityManager } from '@core/auth';
import { QUERY_PARAMETER_NAMES, PATHS } from '@core/models';
import { TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-send-otp',
  templateUrl: './send-otp.component.html',
  styleUrls: ['./send-otp.component.scss'],
})
export class SendOtpComponent implements OnInit {
  email: string;
  form: FormGroup;
  loading = false;
  errors: { detail: string | null; key: string | null } = { detail: null, key: null };
  protected readonly PATHS = PATHS;
  translation: any;

  private readonly router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _translateService = inject(TranslateService);

  get input1(): FormControl {
    return this.form.get('input1') as FormControl;
  }
  get input2(): FormControl {
    return this.form.get('input2') as FormControl;
  }
  get input3(): FormControl {
    return this.form.get('input3') as FormControl;
  }
  get input4(): FormControl {
    return this.form.get('input4') as FormControl;
  }
  get input5(): FormControl {
    return this.form.get('input5') as FormControl;
  }
  get input6(): FormControl {
    return this.form.get('input6') as FormControl;
  }
  async ngOnInit(): Promise<void> {
    this.translation = await firstValueFrom(this._translateService.get('2fa'));

    this.email = history.state.email;
    // this.form = this._fb.group({
    //   input1: ['', Validators.required],
    //   input2: ['', Validators.required],
    //   input3: ['', Validators.required],
    //   input4: ['', Validators.required],
    //   input5: ['', Validators.required],
    //   input6: ['', Validators.required],
    // });
    this.form = new FormGroup({
      input1: new FormControl('', Validators.required),
      input2: new FormControl('', Validators.required),
      input3: new FormControl('', Validators.required),
      input4: new FormControl('', Validators.required),
      input5: new FormControl('', Validators.required),
      input6: new FormControl('', Validators.required),
    });
  }

  login2FA() {
    const value = this.form?.value;
    const otp =
      value.input1 +
      value.input2 +
      value.input3 +
      value.input4 +
      value.input5 +
      value.input6;

    this.loading = true;

    this._identityManager
      .login2FA(this.email, otp, true)
      .pipe(
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: () => this.onSuccess(),
        error: (error: AuthResult) => {
          error.result.assignValidationErrors(this.form).assignErrors(this.errors);
        },
      });
  }

  onSuccess(): void {
    const returnUrl = this._route.snapshot.queryParams[QUERY_PARAMETER_NAMES.ReturnUrl];

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl).then();
      return;
    }

    this.router.navigate([this.PATHS.Home]).then();
  }
}
