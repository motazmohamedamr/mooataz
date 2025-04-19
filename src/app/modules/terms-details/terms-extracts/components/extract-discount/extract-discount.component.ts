import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExtractRequestDetailsVm, ExtractRequestStatusVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { TermsExtractsService } from '../../terms-extracts.service';

@Component({
  selector: 'app-extract-discount',
  templateUrl: './extract-discount.component.html',
  styleUrl: './extract-discount.component.scss',
})
export class ExtractDiscountComponent {
  protected readonly translate = inject(TranslateService);
  protected readonly dialog = inject(MatDialog);
  protected readonly _termsExtractsService = inject(TermsExtractsService);

  lastRequest = this._termsExtractsService.lastRequest;

  @Input() translation: any;
  @Input({ required: true }) extract: ExtractRequestDetailsVm;
  @Output() totalQuantityFromDiscountChange = new EventEmitter<{
    value: number;
    index: number;
  }>();
  @Output() unitPriceFromDiscountChange = new EventEmitter<{
    value: number;
    index: number;
  }>();

  toalQuantityValueChange(value: number, index: number): void {
    this.totalQuantityFromDiscountChange.emit({ value, index });
  }
  unitPriceValueChange(value: number, index: number): void {
    this.unitPriceFromDiscountChange.emit({ value, index });
  }

  get extractStatus(): typeof ExtractRequestStatusVm {
    return ExtractRequestStatusVm;
  }
}
