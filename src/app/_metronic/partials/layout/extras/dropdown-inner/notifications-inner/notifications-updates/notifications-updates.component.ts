import { Component, Input } from '@angular/core';
import { NotificationVm } from '@core/api';

@Component({
  selector: 'app-notifications-updates',
  templateUrl: './notifications-updates.component.html',
  styleUrl: './notifications-updates.component.scss',
})
export class NotificationsUpdatesComponent {
  @Input({ required: true }) notifications: NotificationVm[] = [];
}

