import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ExtractRequestActor,
  ExtractRequestDetailsVm,
  ExtractRequestStatus,
  ExtractRequestStatusLogVm,
  Role,
} from '@core/api';
import { User } from '@core/auth';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { AttachmentsDialogComponent } from '@modules/terms-details/dialogs/attachments-dialog/attachments-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-extract-request-status',
  templateUrl: './extract-request-status.component.html',
  styleUrl: './extract-request-status.component.scss',
})
export class ExtractRequestStatusComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input() user: User;
  @Input({ required: true }) extract: ExtractRequestDetailsVm;
  @Output() openAcceptRejectDialogEmitter = new EventEmitter<any>();

  extractStatuses: Record<string, BadgeItem>;
  actorTranslation: Record<string, string>;

  openAttachmentsDialog(item: ExtractRequestStatusLogVm): void {
    this.dialog.open(AttachmentsDialogComponent, {
      minWidth: '600px',
      data: { attachments: item.attachments },
    });
  }

  ngOnInit(): void {
    this.extractStatuses = {
      [ExtractRequestStatus.Approved]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Approved,
        'badge-light-success'
      ),
      [ExtractRequestStatus.Draft]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Draft,
        'badge-dark'
      ),
      [ExtractRequestStatus.Rejected]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Rejected,
        'badge-light-danger'
      ),
      [ExtractRequestStatus.Completed]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Completed,
        'badge-light-success'
      ),
      [ExtractRequestStatus.Created]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Created,
        'badge-light-info'
      ),
      [ExtractRequestStatus.Transferred]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.Transferred,
        'badge-light-success'
      ),
      [ExtractRequestStatus.TransferredPartial]: new BadgeItem(
        this.translation.extractRequestHistoryStatuses.TransferredPartial,
        'badge-light-success'
      ),
    };
    this.actorTranslation = this.translate.instant('termsDetails.accounts');
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  get actor(): typeof ExtractRequestActor {
    return ExtractRequestActor;
  }
  get role(): typeof Role {
    return Role;
  }

  protected get enableAcceptRejectBtns(): boolean {
    return (
      (this.extract.phase === 1 &&
        this.user.roles.includes(this.role.ProjectManager) &&
        this.extract.status === 0) ||
      (this.extract.phase === 4 &&
        this.user.roles.includes(this.role.GeneralManager) &&
        this.extract.status === 0) ||
      (this.extract.phase === 3 &&
        this.user.roles.includes(this.role.ProjectsManager) &&
        this.extract.status === 0) ||
      (this.extract.phase === 2 &&
        this.user.roles.includes(this.role.TechnicalOfficer) &&
        this.extract.status === 0)
    );
  }

  openAcceptRejectDialog(status: 'accept' | 'reject'): void {
    this.openAcceptRejectDialogEmitter.emit(status);
  }
}
