import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NotificationsInnerComponent } from './dropdown-inner/notifications-inner/notifications-inner.component';
import { QuickLinksInnerComponent } from './dropdown-inner/quick-links-inner/quick-links-inner.component';
import { UserInnerComponent } from './dropdown-inner/user-inner/user-inner.component';
import { LayoutScrollTopComponent } from './scroll-top/scroll-top.component';
import { SearchResultInnerComponent } from './dropdown-inner/search-result-inner/search-result-inner.component';
import {
  NgbDropdown,
  NgbDropdownModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsAlertsComponent } from './dropdown-inner/notifications-inner/notifications-alerts/notifications-alerts.component';
import { NotificationsLogsComponent } from './dropdown-inner/notifications-inner/notifications-logs/notifications-logs.component';
import { NotificationsUpdatesComponent } from './dropdown-inner/notifications-inner/notifications-updates/notifications-updates.component';
import { TimeAgoPipe } from '@core/shared/pipes/timeago.pipe';

@NgModule({
  declarations: [
    NotificationsInnerComponent,
    QuickLinksInnerComponent,
    SearchResultInnerComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
    NotificationsAlertsComponent,
    NotificationsLogsComponent,
    NotificationsUpdatesComponent,
    TimeAgoPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    InlineSVGModule,
    RouterModule,
    NgbTooltipModule,
    TranslateModule,
  ],
  exports: [
    NotificationsInnerComponent,
    QuickLinksInnerComponent,
    SearchResultInnerComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
  ],
  providers: [DatePipe, TimeAgoPipe],
})
export class ExtrasModule {}
