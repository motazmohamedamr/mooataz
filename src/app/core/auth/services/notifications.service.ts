import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  IPageInfo,
  NotificationsClient,
  NotificationType,
  NotificationVm,
  PaginatedListOfNotificationVm,
} from '@core/api';
import { environment } from '@env/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  protected readonly _notificationsClient = inject(NotificationsClient);

  notifications = signal<NotificationVm[]>([]);

  logsNotifications = signal<NotificationVm[]>([]);
  upgradesNotifications = signal<NotificationVm[]>([]);
  alertsNotifications = signal<NotificationVm[]>([]);

  pagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });

  getNotifications(): Observable<PaginatedListOfNotificationVm> {
    return this._notificationsClient
      .getPage(
        5,
        this.pagingOptions().pageIndex,
        undefined,
        this.pagingOptions().ascending,
        this.pagingOptions().sortingBy,
        environment.apiVersion
      )
      .pipe(
        tap((res) => {
          const logs = res.items.filter(
            (item) => item.type === NotificationType.AuditLog
          );
          const alerts = res.items.filter(
            (item) =>
              item.type === NotificationType.SupplyRequest ||
              item.type === NotificationType.SupplierApprovalRequest ||
              item.type === NotificationType.SupplyApprovalRequest ||
              item.type === NotificationType.CovenantRequest ||
              item.type === NotificationType.PriceApprovalRequest ||
              item.type === NotificationType.ExtractRequest
          );
          const upgrades = res.items.filter(
            (item) => item.type === NotificationType.WorkItems
          );
          this.alertsNotifications.update((notifications) => [
            ...notifications,
            ...alerts,
          ]);
          this.logsNotifications.update((notifications) => [...notifications, ...logs]);
          this.upgradesNotifications.update((notifications) => [
            ...notifications,
            ...upgrades,
          ]);
          this.pagingOptions.set(res.pageInfo);
          this.notifications.update((notifications) => [...notifications, ...res.items]);
        })
      );
  }

  addNotification(notification: NotificationVm) {
    this.notifications.update((notifications) => [notification, ...notifications]);
  }

  setReadNotification(notificationId: string) {
    this.notifications.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? ({ ...notification, isRead: true } as NotificationVm)
          : notification
      )
    );
    this.alertsNotifications.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? ({ ...notification, isRead: true } as NotificationVm)
          : notification
      )
    );
    this.logsNotifications.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? ({ ...notification, isRead: true } as NotificationVm)
          : notification
      )
    );
    this.upgradesNotifications.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? ({ ...notification, isRead: true } as NotificationVm)
          : notification
      )
    );
  }

  getMoreNotifications() {
    this.pagingOptions.update((options) => ({
      ...options,
      pageIndex: options.pageIndex + 1,
    }));
    this.getNotifications().subscribe();
  }

  clearNotifications() {
    this.notifications.set([]);
    this.alertsNotifications.set([]);
    this.logsNotifications.set([]);
    this.upgradesNotifications.set([]);
  }
}
