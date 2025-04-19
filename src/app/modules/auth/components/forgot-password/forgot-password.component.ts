import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PATHS, QUERY_PARAMETER_NAMES } from '@core/models';
import { ForgetPasswordCommand, IdentityClient } from '@core/api';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  form: FormGroup;

  loading = false;

  errors: { detail: string | null; key: string | null } = { detail: null, key: null };

  protected readonly PATHS = PATHS;

  success = false;

  constructor(
    private _identityClient: IdentityClient,
    private _handler: ApiHandlerService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  ngOnInit(): void {
    this.form = this._fb.group({
      email: ['', Validators.required],
    });
  }

  forgot(): void {
    this.loading = true;

    this._identityClient
      .forgetPassword(
        environment.apiVersion,
        new ForgetPasswordCommand({ email: this.email.value })
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: () => this.onSuccess(),
        error: (error) =>
          this._handler
            .handleError(error)
            .assignValidationErrors(this.form)
            .assignErrors(this.errors),
      });
  }

  onSuccess(): void {
    this.success = true;

    const returnUrl = this._route.snapshot.queryParams[QUERY_PARAMETER_NAMES.ReturnUrl];

    setTimeout(() => {
      this._router
        .navigate([this.PATHS.Reset], {
          queryParams: { email: this.email.value, returnUrl },
        })
        .then();
    }, 2000);
  }
}
