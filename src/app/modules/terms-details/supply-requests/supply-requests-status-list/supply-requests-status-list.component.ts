import { Component, inject, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  SupplyApprovalRequestActor,
  SupplyApprovalRequestDetailsVm,
  SupplyApprovalRequestStatus,
  SupplyApprovalRequestStatusLogVm,
} from '@core/api';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { AttachmentsDialogComponent } from '@modules/terms-details/dialogs/attachments-dialog/attachments-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-supply-requests-status-list',
  templateUrl: './supply-requests-status-list.component.html',
  styleUrl: './supply-requests-status-list.component.scss',
})
export class SupplyRequestsStatusListComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  @Input() translation: any;
  @Input({ required: true }) history: SupplyApprovalRequestStatusLogVm[] = [];
  @Input({ required: true }) supplyRequest: SupplyApprovalRequestDetailsVm;

  supplyApprovalStatusBadges: Record<string, BadgeItem>;
  actorTranslation: Record<string, string>;

  ngOnInit(): void {
    this.supplyApprovalStatusBadges = {
      [SupplyApprovalRequestStatus.Created]: new BadgeItem(
        this.translation.SupplyApprovalRequestStatus.Created,
        'badge-light-warning'
      ),
      [SupplyApprovalRequestStatus.Rejected]: new BadgeItem(
        this.translation.SupplyApprovalRequestStatus.Rejected,
        'badge-light-danger'
      ),
      [SupplyApprovalRequestStatus.Approved]: new BadgeItem(
        this.translation.SupplyApprovalRequestStatus.Approved,
        'badge-light-success'
      ),
      [SupplyApprovalRequestStatus.Transferred]: new BadgeItem(
        this.translation.SupplyApprovalRequestStatus.Transferred,
        'badge-light-success'
      ),
      [SupplyApprovalRequestStatus.Completed]: new BadgeItem(
        this.translation.SupplyApprovalRequestStatus.Completed,
        'badge-light-success'
      ),
    };
    this.actorTranslation = this.translate.instant('termsDetails.accounts');
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  get actor(): typeof SupplyApprovalRequestActor {
    return SupplyApprovalRequestActor;
  }

  openAttachmentsDialog(item: SupplyApprovalRequestStatusLogVm): void {
    this.dialog.open(AttachmentsDialogComponent, {
      minWidth: '600px',
      data: { attachments: item.attachments },
    });
  }
}
