import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  ExtractRequestDetailsVm,
  ExtractRequestStatusVm,
  ExtractRequestType,
} from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-extract-data',
  templateUrl: './extract-data.component.html',
  styleUrl: './extract-data.component.scss',
})
export class ExtractDataComponent {
  private readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input({ required: true }) extract: ExtractRequestDetailsVm;
  @Output() totalQuantityChange = new EventEmitter<number>();

  toalQuantityValueChange(value: number): void {
    this.totalQuantityChange.emit(value);
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  get extractTypes() {
    return {
      [ExtractRequestType.InProgress]: this.translation.extractTypes.InProgress,

      [ExtractRequestType.Final]: this.translation.extractTypes.Final,
    };
  }

  get extractStatus(): typeof ExtractRequestStatusVm {
    return ExtractRequestStatusVm;
  }
}

