import { Component, inject, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  PriceApprovalRequestActor,
  PriceApprovalRequestDetailsVm,
  PriceApprovalRequestStatus,
  PriceApprovalRequestStatusLogVm,
} from '@core/api';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { AttachmentsDialogComponent } from '@modules/terms-details/dialogs/attachments-dialog/attachments-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-price-requests-status-list',
  templateUrl: './price-requests-status-list.component.html',
  styleUrl: './price-requests-status-list.component.scss',
})
export class PriceRequestsStatusListComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  priceApprovalStatusBadges: Record<string, BadgeItem>;
  actorTranslation: Record<string, string>;

  @Input() translation: any;
  @Input({ required: true }) history: PriceApprovalRequestStatusLogVm[] = [];
  @Input({ required: true }) priceRequest: PriceApprovalRequestDetailsVm;

  ngOnInit(): void {
    this.priceApprovalStatusBadges = {
      [PriceApprovalRequestStatus.Created]: new BadgeItem(
        this.translation.PriceApprovalRequestStatus.Created,
        'badge-light-warning'
      ),
      [PriceApprovalRequestStatus.Rejected]: new BadgeItem(
        this.translation.PriceApprovalRequestStatus.Rejected,
        'badge-light-danger'
      ),
      [PriceApprovalRequestStatus.Approved]: new BadgeItem(
        this.translation.PriceApprovalRequestStatus.Approved,
        'badge-light-success'
      ),
      [PriceApprovalRequestStatus.Completed]: new BadgeItem(
        this.translation.PriceApprovalRequestStatus.Completed,
        'badge-light-success'
      ),
      [PriceApprovalRequestStatus.WaitingNewSuppliers]: new BadgeItem(
        this.translation.priceApprovalStatus.WaitingNewSuppliers,
        'badge-light-warning'
      ),
    };
    this.actorTranslation = this.translate.instant('termsDetails.priceRequests.accounts');
  }

  get termStatusBadge(): any {
    if (!this.history || !this.history.length) return '-';
    return this.priceApprovalStatusBadges[this.history[0].status];
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  get actor(): typeof PriceApprovalRequestActor {
    return PriceApprovalRequestActor;
  }

  openAttachmentsDialog(item: PriceApprovalRequestStatusLogVm): void {
    this.dialog.open(AttachmentsDialogComponent, {
      minWidth: '600px',
      data: { attachments: item.attachments },
    });
  }
}
