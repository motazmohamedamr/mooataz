import { AuthTokenNotFoundError } from './auth.errors';
import { decodeJwtPayload } from './token-decode-helpers';
import {AuthResponse, Role} from '@core/api';

export interface ITokenPayload {
  sub?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  created?: string;
  roles?: string | string[];
  tenant: string;
  nbf: number;
  exp: number;
  iat: number;
  iss: string;
}

export class AuthToken {
  private _payload: ITokenPayload = null;
  private readonly _token: string = null;
  private readonly _refreshToken: string = null;
  private readonly _createdAt?: Date;

  constructor(response: AuthResponse) {
    if (!response) {
      return;
    }

    this._token = response.token;
    this._refreshToken = response.refreshToken;

    try {
      this.parsePayload();
    } catch (err) {
      // token is present but has got a problem, including illegal
      if (!(err instanceof AuthTokenNotFoundError)) {
        throw err;
      }
    }

    this._createdAt = this.prepareCreatedAt();
  }

  /** Get the token payload */
  get payload(): ITokenPayload {
    return this._payload;
  }

  get refreshToken(): string {
    return this._refreshToken;
  }

  /** Validate value and convert to string, if value is not valid return empty string */
  get value(): string {
    return !!this._token ? this._token : null;
  }

  /** Is data expired */
  get isValid(): boolean {
    return !!this._token && (!this.expDate || new Date() < this.expDate);
  }

  /** Returns token expiration date */
  get expDate(): Date {
    const decoded = this._payload;

    if (!decoded || !decoded.hasOwnProperty('exp')) {
      return null;
    }

    const date = new Date(0); // 'cause jwt token are set in seconds
    date.setUTCSeconds(decoded.exp); // jwt token are set in seconds x
    return date;
  }

  /** Returns the token's creation date */
  get createdDate(): Date {
    return this._createdAt;
  }

  /** for JWT token, the iat (issued at) field of the token payload contains the creation Date */
  private prepareCreatedAt(): Date {
    const decoded = this._payload;
    return decoded && decoded.iat ? new Date(Number(decoded.iat) * 1000) : null;
  }

  private parsePayload(): void {
    if (!this._token) {
      this._payload = null;
      throw new AuthTokenNotFoundError('Token not found.');
    }

    this._payload = decodeJwtPayload(this._token);
  }
}
