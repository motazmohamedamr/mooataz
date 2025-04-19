import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { LayoutService } from '@metronic/layout';
import { IdentityManager } from '@core/auth';
import { firstValueFrom, map, Observable } from 'rxjs';
import { AccountDetailsVm, NotificationsClient } from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { NotificationService } from '@core/auth/services/notifications.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  toolbarButtonIconSizeClass = 'svg-icon-1';
  headerLeft: string = 'menu';

  @ViewChild('notificationsElem') notificationsElem: ElementRef<HTMLDivElement>;
  private readonly _notificationClient = inject(NotificationsClient);
  private readonly _notificationService = inject(NotificationService);

  userDetails$: Observable<AccountDetailsVm>;
  showNotifications = signal(false);

  notReadCount = signal(0);

  constructor(
    private _layout: LayoutService,
    private _identityManager: IdentityManager,
    protected translate: TranslateService
  ) {}

  @HostListener('document:click', ['$event'])
  docClicked(event: any) {
    if (
      this.showNotifications() &&
      !this.notificationsElem.nativeElement.contains(event.target)
    ) {
      this.showNotifications.set(false);
    }
  }

  async ngOnInit(): Promise<void> {
    this.userDetails$ = this._identityManager.account$;
    this.headerLeft = this._layout.getProp('header.left') as string;
    const count = await firstValueFrom(
      this._notificationClient
        .getNotReadCount(environment.apiVersion)
        .pipe(map((result) => result?.result || 0))
    );
    this.notReadCount.set(count);
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
  }

  closeNotificationDialog(notificationId: string = undefined) {
    if (notificationId) {
      const notification = this._notificationService
        .notifications()
        .find((n) => n.id === notificationId);
      if (notification && !notification.isRead) {
        this.notReadCount.update((count) => count - 1);
        this._notificationClient
          .read(notificationId, environment.apiVersion)
          .subscribe(() => {
            this._notificationService.setReadNotification(notificationId);
          });
      }
    }
    this.showNotifications.set(false);
  }
}
