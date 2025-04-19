import { Component, inject, Input } from '@angular/core';
import { NotificationVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications-logs',
  templateUrl: './notifications-logs.component.html',
  styleUrl: './notifications-logs.component.scss',
})
export class NotificationsLogsComponent {
  protected readonly translate = inject(TranslateService);
  @Input({ required: true }) notifications: NotificationVm[] = [];
}

