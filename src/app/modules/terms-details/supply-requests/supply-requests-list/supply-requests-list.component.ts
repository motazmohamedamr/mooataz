import { Component, inject, Input } from '@angular/core';
import { SupplyApprovalRequestDetailsVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-supply-requests-list',
  templateUrl: './supply-requests-list.component.html',
  styleUrl: './supply-requests-list.component.scss',
})
export class SupplyRequestsListComponent {
  protected readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input() supplyRequest: SupplyApprovalRequestDetailsVm;

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}
