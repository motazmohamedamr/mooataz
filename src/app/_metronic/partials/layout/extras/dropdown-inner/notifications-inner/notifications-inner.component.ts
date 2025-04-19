import { Component, EventEmitter, HostBinding, Output, inject } from '@angular/core';
import { NotificationType, NotificationVm } from '@core/api';
import { NotificationService } from '@core/auth/services/notifications.service';

export type NotificationsTabsType = 'alerts' | 'logs' | 'updates';

@Component({
  selector: 'app-notifications-inner',
  templateUrl: './notifications-inner.component.html',
  styleUrls: ['./notifications-inner.component.scss'],
  providers: [],
})
export class NotificationsInnerComponent {
  @HostBinding('class') class = 'w-350px w-lg-375px';
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  protected readonly notificationService = inject(NotificationService);

  @Output() closeNotification = new EventEmitter<string>();

  activeTabId: NotificationsTabsType = 'alerts';
  alerts: Array<NotificationVm>;
  notificationType = NotificationType;

  constructor() {}

  setActiveTabId(tabId: NotificationsTabsType) {
    this.activeTabId = tabId;
  }

  closeNot(notId: string) {
    this.closeNotification.emit(notId);
  }
}
