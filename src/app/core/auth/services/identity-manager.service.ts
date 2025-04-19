import {
  AuthResponse,
  LoginCommand,
  RefreshTokenCommand,
  ResetPasswordCommand,
  IdentityClient,
  ProfileClient,
  AccountDetailsVm,
  LoginTwoFactorAuthenticationCommand,
} from '@core/api';
import { Role as ApiRole } from '@core/api';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject, of, from } from 'rxjs';
import { map, tap, catchError, finalize, switchMap } from 'rxjs/operators';
import { PATHS, QUERY_PARAMETER_NAMES } from '@core/models';
import { TokenService, AuthResult } from '@core/auth';
import { AuthToken, ITokenPayload } from './token';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { NotificationService } from './notifications.service';

export class User {
  id: string;
  userName: string;
  fullName?: string;
  email: string;
  phoneNumber: string;
  created?: Date;
  roles?: ApiRole[];
  expiresAt: number;
  tenant: string;

  constructor(payload: ITokenPayload) {
    this.id = payload.sub;
    this.userName = payload.name;
    this.fullName = payload.fullName;
    this.email = payload.email;
    this.phoneNumber = payload.phoneNumber;
    this.created = new Date(payload.created);
    this.roles = User.mapRoles(payload.roles);
    this.expiresAt = payload.exp;
    this.tenant = payload.tenant;
  }

  static mapRoles(roles: string | string[]): ApiRole[] {
    if (!roles) return [];
    return Array.isArray(roles)
      ? roles.map((role) => ApiRole[role as keyof typeof ApiRole])
      : [ApiRole[roles as keyof typeof ApiRole]];
  }
}

@Injectable({
  providedIn: 'root',
})
export class IdentityManager {
  private _account$ = new BehaviorSubject<AccountDetailsVm>(null);

  constructor(
    private readonly _identityClient: IdentityClient,
    private readonly _profileClient: ProfileClient,
    private readonly _tokenService: TokenService,
    private readonly _router: Router,
    private readonly _handler: ApiHandlerService,
    private readonly _notificationService: NotificationService
  ) {}

  get account$(): BehaviorSubject<AccountDetailsVm> {
    return this._account$;
  }

  getUser(): User | null {
    const payload = this._tokenService.token?.payload;
    return payload ? new User(payload) : null;
  }

  initAccount(): Observable<AccountDetailsVm> {
    return this._profileClient.get(environment.apiVersion).pipe(
      map((account) => {
        this._account$.next(account);
        localStorage.setItem('accountModules', JSON.stringify(account.modules));
        return account;
      }),
      catchError((error) => {
        console.error('Failed to initialize account', error);
        return throwError(() => error);
      })
    );
  }

  hasAnyRole(roles: ApiRole | ApiRole[]): Observable<boolean> {
    const user = this.getUser();
    if (!user?.roles) return of(false);
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return of(roleArray.some((role) => user.roles.includes(role)));
  }

  canAccess(modules: string | string[]): Observable<boolean> {
    const moduleArray = Array.isArray(modules) ? modules : [modules];
    return this.account$.pipe(
      map((account) => {
        const accountModules =
          account?.modules || JSON.parse(localStorage.getItem('accountModules') || '[]');
        return moduleArray.some((module) => accountModules.includes(module));
      }),
      catchError((error) => {
        console.error('Error checking access', error);
        return of(false);
      })
    );
  }

  login(email: string, password: string, rememberMe: boolean): Observable<AuthResult> {
    return this.processResultToken(
      this._identityClient.login(
        environment.apiVersion,
        new LoginCommand({ email, password })
      ),
      rememberMe
    );
  }

  resetPassword(
    email: string,
    token: string,
    password: string,
    confirmPassword: string,
    rememberMe: boolean
  ): Observable<AuthResult> {
    return this.processResultToken(
      this._identityClient.resetPassword(
        environment.apiVersion,
        new ResetPasswordCommand({ email, token, password, confirmPassword })
      ),
      rememberMe
    );
  }

  refreshToken(returnUrl?: string): Observable<AuthResult> {
    const refreshToken = this._tokenService.refreshToken;
    const rememberMe = this._tokenService.rememberMe;

    if (!refreshToken) {
      return this.logout(returnUrl).pipe(map(() => new AuthResult(null, null)));
    }

    if (this._identityClient) {
      return this.processResultToken(
        this._identityClient.refreshToken(
          environment.apiVersion,
          new RefreshTokenCommand({ refreshToken })
        ),
        rememberMe
      ).pipe(
        catchError(() =>
          this.logout(returnUrl).pipe(map(() => new AuthResult(null, null)))
        )
      );
    }
  }

  logout(returnUrl?: string): Observable<boolean> {
    if (!this._identityClient) return this.forceLogout(returnUrl);
    return this._identityClient.logout(environment.apiVersion).pipe(
      finalize(() => this.forceLogout(returnUrl)),
      map(() => true),
      catchError(() => {
        console.warn('Logout failed, forcing logout.');
        return of(true);
      })
    );
  }

  public forceLogout(returnUrl?: string): Observable<boolean> {
    this._account$.next(null);
    localStorage.removeItem('accountModules');
    this._notificationService.clearNotifications();
    this._tokenService.clear();
    return from(
      this._router.navigate([PATHS.Login], {
        queryParams: returnUrl
          ? { [QUERY_PARAMETER_NAMES.ReturnUrl]: returnUrl }
          : undefined,
      })
    );
  }
  public hasAnyPermission(permissions: string | string[]): Observable<boolean> {
    return this.account$.pipe(
      switchMap((account) => {
        if (!account) {
          return of(false);
        }

        if (!account.permissions) {
          return of(false);
        }

        if (!Array.isArray(permissions)) {
          permissions = [permissions];
        }

        return of(
          permissions.some((permission) => account.permissions.includes(permission))
        );
      })
    );
  }
  public processLogout(returnUrl?: string): Observable<boolean> {
    const user = this.getUser();

    if (!user) {
      return of(false);
    }

    const refresh = !!this._tokenService.rememberMe;

    if (refresh) {
      if (!this.refreshToken(returnUrl))
        return this.logout(returnUrl).pipe(map(() => false));
      return this.refreshToken(returnUrl).pipe(
        switchMap((result: AuthResult) => {
          if (!!result.user) {
            return of(true);
          }

          return this.logout(returnUrl).pipe(map(() => false));
        })
      );
    }

    return this.logout(returnUrl).pipe(map(() => false));
  }

  public login2FA(
    email: string,
    otp: string,
    rememberMe: boolean
  ): Observable<AuthResult> {
    return this.processResultToken(
      this._identityClient.login2fa(
        environment.apiVersion,
        new LoginTwoFactorAuthenticationCommand({ email, otp })
      ),
      rememberMe
    );
  }

  private processResultToken(
    tokenObservable: Observable<AuthResponse>,
    rememberMe: boolean
  ): Observable<AuthResult> {
    return tokenObservable.pipe(
      tap((token) => {
        if (token.requires2FA) {
          this._router.navigateByUrl(PATHS.TwoFA, { state: { email: token.email } });
        }
      }),
      map((token) => new AuthToken(token)),
      tap((authToken) => {
        this.authorize(authToken, rememberMe);
        if (this._notificationService) {
          this._notificationService.getNotifications().subscribe();
        }
      }),
      map((authToken) => new AuthResult(new User(authToken.payload), null)),
      catchError((error) =>
        throwError(() => new AuthResult(null, this._handler.handleError(error)))
      )
    );
  }

  private authorize(authToken: AuthToken, rememberMe: boolean): void {
    if (authToken) {
      this._tokenService.set(authToken, rememberMe);
      this.initAccount().subscribe();
    } else {
      this._tokenService.clear();
    }
  }
}
