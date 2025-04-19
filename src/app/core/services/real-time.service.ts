import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, NotificationVm } from '@core/api';
import { IdentityManager, TokenService } from '@core/auth';
import { environment } from '@env/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

export class RealTimeConnection {
  notifications$ = new Subject<NotificationVm>();
}

@Injectable({
  providedIn: 'root',
})
export class RealTimeService {
  connection$ = new BehaviorSubject<RealTimeConnection>(null);

  private _hubConnection: signalR.HubConnection;
  private _interval: any;

  constructor(
    private _tokenService: TokenService,
    private _identityManager: IdentityManager,
    private _toastr: ToastrService,
    private _translateService: TranslateService,
    private _ngZone: NgZone,
    @Optional() @Inject(API_BASE_URL) private _baseUrl?: string
  ) {
    window.addEventListener('online', () => window.location.reload());
  }

  async tryConnect(): Promise<RealTimeConnection> {
    const connection = new RealTimeConnection();

    if (this._hubConnection) {
      return connection;
    }

    try {
      await this.connect();
    } catch (e) {
      console.log(e);
    }

    this.connection$.next(connection);

    return connection;
  }

  async disconnect(): Promise<void> {
    await this._hubConnection?.stop();

    this.unsubscribe();
  }

  private async connect(): Promise<any> {
    const token = this._tokenService.token;
    const logLevel = environment.production
      ? signalR.LogLevel.None
      : signalR.LogLevel.Information;

    const disconnectedTitle = await this.translate('realTime.disconnectedTitle');
    const disconnected = await this.translate('realTime.disconnected');
    const reconnected = await this.translate('realTime.reconnected');

    this._hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this._baseUrl + '/hubs/notifications', {
        accessTokenFactory(): string | Promise<string> {
          return token.value;
        },
      })
      .configureLogging(logLevel)
      .withAutomaticReconnect()
      .build();

    this._hubConnection.onreconnecting(() => {
      this.toastError(disconnected, disconnectedTitle);
    });

    this._hubConnection.onreconnected(() => {
      this._toastr.clear();
      this._toastr.success(reconnected);
    });

    this._hubConnection.onclose((error) => {
      if (error) {
        this.toastError(error.message, error.name);
      }
    });

    this._hubConnection.on('ReceiveMessage', (message: any) => {
      const connection = this.connection$.getValue();

      switch (message.type) {
        case 'notification':
          connection.notifications$.next(new NotificationVm(message.data));
          break;

        case 'logout':
          this._identityManager.forceLogout();
          break;
      }
    });

    try {
      await this._hubConnection.start();
    } catch (e) {
      this.toastError(disconnected, disconnectedTitle);

      throw e;
    }
  }

  private unsubscribe(): void {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  private toastError(message: string, title: string): void {
    this._ngZone.run(() => {
      this._toastr.error(message, title, {
        easeTime: 1000,
        disableTimeOut: true,
        tapToDismiss: true,
        positionClass: 'toast-bottom-center',
      });
    });
  }

  private translate(key: string): Promise<string> {
    return this._translateService.get(key).toPromise();
  }
}
