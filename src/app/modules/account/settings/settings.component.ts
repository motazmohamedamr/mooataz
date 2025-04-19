import { Component, OnInit } from '@angular/core';
import { IdentityManager } from '@core/auth';
import { AccountDetailsVm } from '@core/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  userDetails$: Observable<AccountDetailsVm>;

  constructor(private _identityManager: IdentityManager) {}

  ngOnInit(): void {
    this.userDetails$ = this._identityManager.account$.asObservable();
  }
}
