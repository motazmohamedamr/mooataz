import { Component, inject, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  CovenantRequestActor,
  CovenantRequestDetailsVm,
  CovenantRequestStatus,
  CovenantRequestStatusLogVm,
} from '@core/api';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { AttachmentsDialogComponent } from '@modules/terms-details/dialogs/attachments-dialog/attachments-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-convenant-requests-history',
  templateUrl: './convenant-requests-history.component.html',
  styleUrl: './convenant-requests-history.component.scss',
})
export class ConvenantRequestsHistoryComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  @Input() translation: any;
  @Input({ required: true }) history: CovenantRequestStatusLogVm[] = [];
  @Input({ required: true }) covenantRequest: CovenantRequestDetailsVm;

  covenantApprovalStatusBadges: Record<string, BadgeItem>;
  actorTranslation: Record<string, string>;

  ngOnInit(): void {
    this.covenantApprovalStatusBadges = {
      [CovenantRequestStatus.Rejected]: new BadgeItem(
        this.translation.CovenantRequestStatus.Rejected,
        'badge-light-danger'
      ),
      [CovenantRequestStatus.Created]: new BadgeItem(
        this.translation.CovenantRequestStatus.Created,
        'badge-light-warning'
      ),
      [CovenantRequestStatus.Transferred]: new BadgeItem(
        this.translation.CovenantRequestStatus.Transferred,
        'badge-light-success'
      ),
      [CovenantRequestStatus.Approved]: new BadgeItem(
        this.translation.CovenantRequestStatus.Approved,
        'badge-light-success'
      ),
      [CovenantRequestStatus.Completed]: new BadgeItem(
        this.translation.CovenantRequestStatus.Completed,
        'badge-light-success'
      ),
    };
    this.actorTranslation = this.translate.instant('termsDetails.accounts');
  }
  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  openAttachmentsDialog(item: CovenantRequestStatusLogVm): void {
    this.dialog.open(AttachmentsDialogComponent, {
      minWidth: '600px',
      data: { attachments: item.attachments },
    });
  }

  get actor(): typeof CovenantRequestActor {
    return CovenantRequestActor;
  }
}
