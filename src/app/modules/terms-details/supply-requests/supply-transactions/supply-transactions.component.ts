import { Component, Input, inject } from '@angular/core';
import { SupplyApprovalRequestTransactionReqeustVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-supply-transactions',
  templateUrl: './supply-transactions.component.html',
  styleUrl: './supply-transactions.component.scss',
})
export class SupplyTransactionsComponent {
  private readonly translate = inject(TranslateService);
  @Input() translation: any;

  @Input({ required: true }) transactions: SupplyApprovalRequestTransactionReqeustVm[] =
    [];

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}
