import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PATHS, QUERY_PARAMETER_NAMES } from '@core/models';
import { AuthResult, IdentityManager } from '@core/auth';
import { finalize } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
})
export class ResetComponent implements OnInit {
  form: FormGroup;

  loading = false;

  showPassword = false;

  errors: { detail: string | null; key: string | null } = { detail: null, key: null };

  constructor(
    private _identityManager: IdentityManager,
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get token(): FormControl {
    return this.form.get('token') as FormControl;
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  ngOnInit(): void {
    const email = this._route.snapshot.queryParams['email'];

    this.form = this._fb.group({
      email: [email || '', Validators.required],
      token: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  reset(): void {
    this.loading = true;

    this._identityManager
      .resetPassword(
        this.email.value,
        this.token.value,
        this.password.value,
        this.confirmPassword.value,
        true
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: () => this.onSuccess(),
        error: (error: AuthResult) =>
          error.result.assignValidationErrors(this.form).assignErrors(this.errors),
      });
  }

  onSuccess(): void {
    const returnUrl = this._route.snapshot.queryParams[QUERY_PARAMETER_NAMES.ReturnUrl];

    if (returnUrl) {
      this._router.navigateByUrl(returnUrl).then();
      return;
    }

    this._router.navigate([PATHS.Home]).then();
  }
}
