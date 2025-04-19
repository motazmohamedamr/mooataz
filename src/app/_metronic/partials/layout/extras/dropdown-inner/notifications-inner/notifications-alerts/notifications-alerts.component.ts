import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationType, NotificationVm } from '@core/api';

@Component({
  selector: 'app-notifications-alerts',
  templateUrl: './notifications-alerts.component.html',
  styleUrl: './notifications-alerts.component.scss',
})
export class NotificationsAlertsComponent {
  private readonly router = inject(Router);
  @Input({ required: true }) notifications: NotificationVm[] = [];

  @Output() closeNotification = new EventEmitter<string>();
  @Output() showMoreNotificationsEv = new EventEmitter<void>();

  routeDeepLink(notification: NotificationVm) {
    if (!notification.data || !notification.data.termId || !notification.data.projectId)
      return;
    const maptoToRoute: Record<number, string> = {
      [NotificationType.SupplyApprovalRequest]: 'supply-requests',
      [NotificationType.CovenantRequest]: 'convenant-requests',
      [NotificationType.PriceApprovalRequest]: 'price-requests',
      [NotificationType.ExtractRequest]: 'extracts',
    };
    if (notification.type === NotificationType.ExtractRequest) {
      this.router.navigate(
        [
          '/',
          'terms-details',
          notification.data?.termId,
          notification.data?.projectId,
          maptoToRoute[notification.type],
          notification.data?.entityId,
        ],
        { queryParams: { notification: true } }
      );
    } else if (notification.type === NotificationType.SupplyApprovalRequest) {
      this.router.navigate(
        [
          '/',
          'terms-details',
          notification.data?.termId,
          notification.data?.projectId,
          maptoToRoute[notification.type],
        ],
        { queryParams: { requestId: notification?.data.entityId } }
      );
    } else {
      this.router.navigate([
        '/',
        'terms-details',
        notification.data?.termId,
        notification.data?.projectId,
        maptoToRoute[notification.type],
      ]);
    }
    this.closeNotification.emit(notification.id);
  }

  showMoreNotifications() {
    this.showMoreNotificationsEv.emit();
  }
}
