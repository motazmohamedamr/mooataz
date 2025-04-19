import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { IdentityManager, AuthResult } from '@core/auth';
import { PATHS, QUERY_PARAMETER_NAMES } from '@core/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenInterceptor } from '@core/interceptors/token.interceptor';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form: FormGroup;

  showPassword = false;

  loading = false;

  errors: { detail: string | null; key: string | null } = { detail: null, key: null };

  protected readonly PATHS = PATHS;

  constructor(
    private _identityManager: IdentityManager,
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private x: TokenInterceptor
  ) {}

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  ngOnInit(): void {
    this.form = this._fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get language(): string {
    return localStorage.getItem('lang') || 'ar';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.loading = true;

    this._identityManager
      .login(this.email.value, this.password.value, true)
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
      this._router.navigateByUrl(returnUrl).then();
      return;
    }

    this._router.navigate([this.PATHS.Dashboard]).then();
  }
}
