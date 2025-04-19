import { Component, inject, Input } from '@angular/core';
import { ExtractRequestTransactionReqeustVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-extract-transactions',
  templateUrl: './extract-transactions.component.html',
  styleUrl: './extract-transactions.component.scss',
})
export class ExtractTransactionsComponent {
  private readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input() transactions: ExtractRequestTransactionReqeustVm[];

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}

