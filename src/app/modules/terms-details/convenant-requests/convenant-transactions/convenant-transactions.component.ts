import { Component, inject, Input } from '@angular/core';
import { CovenantTransactionRequestVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-convenant-transactions',
  templateUrl: './convenant-transactions.component.html',
  styleUrl: './convenant-transactions.component.scss',
})
export class ConvenantTransactionsComponent {
  private readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input({ required: true }) transactions: CovenantTransactionRequestVm[];

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}

