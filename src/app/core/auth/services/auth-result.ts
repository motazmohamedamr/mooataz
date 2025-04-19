import { User } from '@core/auth';
import { HttpResult } from '@core/models/http-result';

export class AuthResult {
  constructor(private readonly _user: User, private readonly _result: HttpResult) {}

  /** Get current user if result is succeeded or null if failed. */
  get user(): User {
    return this._user;
  }

  get result(): HttpResult {
    return this._result;
  }
}
