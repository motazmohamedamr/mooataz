import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import {
  ExtractRequestDetailsVm,
  ExtractRequestStatusVm,
  ExtractRequestType,
} from '@core/api';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-item-extracts',
  templateUrl: './item-extracts.component.html',
  styleUrl: './item-extracts.component.scss',
})
export class ItemExtractsComponent implements OnInit {
  protected readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input({ required: true }) extractList: ExtractRequestDetailsVm[];
  @Output() goToDetails = new EventEmitter<ExtractRequestDetailsVm>();

  extractTypes: Record<string, BadgeItem>;
  extractStatuses: Record<string, BadgeItem>;

  ngOnInit(): void {
    this.extractTypes = {
      [ExtractRequestType.InProgress]: new BadgeItem(
        this.translation.extractTypes.InProgress,
        'badge-light-warning'
      ),
      [ExtractRequestType.Final]: new BadgeItem(
        this.translation.extractTypes.Final,
        'badge-light-success'
      ),
    };
    this.extractStatuses = {
      [ExtractRequestStatusVm.Approved]: new BadgeItem(
        this.translation.extractStatuses.Approved,
        'badge-light-success'
      ),
      [ExtractRequestStatusVm.Draft]: new BadgeItem(
        this.translation.extractStatuses.Draft,
        'badge-dark'
      ),
      [ExtractRequestStatusVm.Rejected]: new BadgeItem(
        this.translation.extractStatuses.Rejected,
        'badge-light-danger'
      ),
      [ExtractRequestStatusVm.Pending]: new BadgeItem(
        this.translation.extractStatuses.Pending,
        'badge-light-warning'
      ),
    };
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  showExtractDetails(extract: ExtractRequestDetailsVm) {
    this.goToDetails.emit(extract);
  }
}

