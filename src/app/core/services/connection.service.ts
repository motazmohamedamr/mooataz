import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ConnectionsClient } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  interval: any;

  sub: Subscription;

  offline = false;

  constructor(
    private _connectionClient: ConnectionsClient,
    private _toastr: ToastrService,
    private _translateService: TranslateService
  ) {}

  init(): void {
    this.generate204();

    this.interval = setInterval(() => {
      this.generate204();
    }, 1000 * 10); // every 5 secs
  }

  destroy(): void {
    clearInterval(this.interval);
  }

  private generate204(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }

    this.sub = this._connectionClient.generate204().subscribe({
      next: () => {
        if (this.offline) {
          this.offline = false;

          this._translateService
            .get('general.backOnline')
            .subscribe((value) => this._toastr.success(value));
        }
      },
      error: () => {
        this.offline = true;

        this._translateService
          .get('errors.noConnection')
          .subscribe((value) => this._toastr.error(value));
      },
    });
  }
}
