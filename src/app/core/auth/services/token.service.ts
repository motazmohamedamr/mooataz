import { Injectable } from '@angular/core';
import { AuthToken } from './token';
import { LocalStorageService } from '@core/services/local-storage.service';
import { AuthResponse } from '@core/api';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN = 'refresh_token';
const REMEMBER_ME = 'refresh';

/**
 * Service that allows you to manage authentication token - get, set,
 * clear and also listen to token changes over time.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private _tokenStorage: LocalStorageService) {}

  /** Returns the current token from localStorage */
  get token(): AuthToken {
    return new AuthToken(new AuthResponse({ token: this._tokenStorage.get(TOKEN_KEY) }));
  }

  get refreshToken(): string {
    return this._tokenStorage.get(REFRESH_TOKEN);
  }

  get rememberMe(): boolean {
    return !!this._tokenStorage.get(REMEMBER_ME);
  }

  /** Sets token to storage */
  set(token: AuthToken, rememberMe: boolean): void {
    this._tokenStorage.set(TOKEN_KEY, token.value);
    this._tokenStorage.set(REFRESH_TOKEN, token.refreshToken);

    if (rememberMe) {
      this._tokenStorage.set(REMEMBER_ME, '1');
    }
  }

  /** Removes the token and published token value */
  clear(): void {
    this._tokenStorage.remove(TOKEN_KEY);
    this._tokenStorage.remove(REFRESH_TOKEN);
    this._tokenStorage.remove(REMEMBER_ME);
  }
}
