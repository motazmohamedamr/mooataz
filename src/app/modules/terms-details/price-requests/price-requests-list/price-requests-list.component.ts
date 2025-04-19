import { Component, inject, Input } from '@angular/core';
import { PriceApprovalRequestDetailsVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-price-requests-list',
  templateUrl: './price-requests-list.component.html',
  styleUrl: './price-requests-list.component.scss',
})
export class PriceRequestsListComponent {
  protected readonly _translate = inject(TranslateService);

  @Input()
  translation: any;

  @Input({ required: true }) priceRequest: PriceApprovalRequestDetailsVm;
  @Input({ required: true }) priceApprovalStatusBadges: any;

  get measurementUnitName(): string {
    return this.priceRequest?.measurementUnit?.name[
      this._translate.currentLang as 'ar' | 'en'
    ];
  }

  get termStatusBadge() {
    return this.priceApprovalStatusBadges[this.priceRequest?.status];
  }

  get locale(): string {
    return this._translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}

