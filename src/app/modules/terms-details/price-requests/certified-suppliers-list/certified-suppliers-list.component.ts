import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  AttachmentType,
  ChangePriceApprovalRequestStatusDto,
  FileAttachmentDto,
  FileResponse,
  IChangePriceApprovalRequestStatusDto,
  PriceApprovalRequestPhase,
  PriceApprovalRequestStatus,
  PriceApprovalRequestSupplierDto,
  PriceApprovalRequestSupplierVm,
  PriceRequestsApprovalsClient,
  Role,
  StorageFile,
} from '@core/api';
import { catchError, concatMap, first, forkJoin, Observable, of, tap } from 'rxjs';
import { environment } from '@env/environment';
import { getMimeTypeFromExtension } from '@modules/supplier-approvals/shared/extension-to-mimetype';
import { ToastrService } from 'ngx-toastr';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';

export type PriceSupplierAttachment = {
  sizeInBytes: number;
  displayName: string;
  mimeType: string;
  extension: string;
  uniqueKey: string;
  file: File;
};

@Component({
  selector: 'app-certified-suppliers-list',
  templateUrl: './certified-suppliers-list.component.html',
  styleUrl: './certified-suppliers-list.component.scss',
})
export class CertifiedsuppliersComponent {
  @Input() translation: any;
  @Input({ required: true }) suppliers: PriceApprovalRequestSupplierVm[] = [];
  @Input() userRoles: Role[] = [];
  @Input({ required: true }) phase: number = 0;
  @Input() priceRequestId: string = '';
  @Input() termId: string = '';
  @Input() projectId: string = '';
  @Input() enableOpenAddSupplierBtn: boolean;

  @Output() refreshRequest = new EventEmitter<boolean>();
  @Output() openAddSupplyDialog = new EventEmitter<void>();
  @Output() deleteSupplier = new EventEmitter<string>();

  uploadFileObs: Observable<FileResponse>[] = [];

  protected translate = inject(TranslateService);
  protected dialog = inject(MatDialog);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _toastr = inject(ToastrService);
  private readonly _priceRequestsApprovalsClient = inject(PriceRequestsApprovalsClient);

  openAddSupply() {
    this.openAddSupplyDialog.emit();
  }

  fileAddedToSupplier(data: {
    supplierAttachment: PriceSupplierAttachment;
    supplierId: string;
  }) {
    const supplierIdx = this.suppliers.findIndex((s) => s.supplierId === data.supplierId);
    if (supplierIdx < 0) return;

    const supplierAttachments = this.suppliers[supplierIdx].attachments;
    supplierAttachments.push({
      displayName: data.supplierAttachment.displayName,
      uniqueName: data.supplierAttachment.displayName,
      extension: data.supplierAttachment.extension,
      mimeType: data.supplierAttachment.mimeType,
      uniqueKey: data.supplierAttachment.uniqueKey,
      file: data.supplierAttachment.file,
      url: '',
    } as FileAttachmentDto & { file: File; mimeType: string });

    this.suppliers[supplierIdx].attachments = supplierAttachments;
    this.cdr.detectChanges();
  }

  deleteFile(data: { uniqueKey: string; supplierId: string }) {
    const supplierIdx = this.suppliers.findIndex((s) => s.supplierId === data.supplierId);
    if (supplierIdx < 0) return;
    let supplierAttachments: FileAttachmentDto[] =
      this.suppliers[supplierIdx].attachments;
    supplierAttachments = supplierAttachments.filter(
      (attachment) => attachment.uniqueKey !== data.uniqueKey
    );
    this.suppliers[supplierIdx].attachments = supplierAttachments;
    this.cdr.detectChanges();
  }

  deleteSupplierHandler(supplierId: string) {
    this.deleteSupplier.emit(supplierId);
  }

  toggleSupplier(data: { checked: boolean; supplierId: string }) {
    const supplierIdx = this.suppliers.findIndex((s) => s.supplierId === data.supplierId);
    if (supplierIdx < 0) return;
    this.suppliers[supplierIdx].selected = data.checked;
    this.cdr.detectChanges();
  }

  get role(): typeof Role {
    return Role;
  }

  private callAccept(): Observable<void> {
    const currentPhaseToPhase: Partial<Record<Role, PriceApprovalRequestPhase>> = {
      [PriceApprovalRequestPhase.PurchaseReview]:
        PriceApprovalRequestPhase.TechnicalOfficeReview,
      [PriceApprovalRequestPhase.TechnicalOfficeReview]:
        PriceApprovalRequestPhase.SupplierSelection,
      [PriceApprovalRequestPhase.SupplierSelection]:
        PriceApprovalRequestPhase.GeneralManagerReview,
      [PriceApprovalRequestPhase.GeneralManagerReview]:
        PriceApprovalRequestPhase.Completed,
    };

    const request: IChangePriceApprovalRequestStatusDto = {
      notes: null,
      phase: currentPhaseToPhase[this.phase as PriceApprovalRequestPhase],
      suppliers: this.suppliers.map(
        (supplier: PriceApprovalRequestSupplierVm) =>
          ({
            supplierId: supplier.supplierId,
            attachments: (
              supplier.attachments as (FileAttachmentDto & { file: File })[]
            ).map((attachment) => ({
              uniqueKey: attachment.uniqueKey,
              displayName: attachment.displayName,
              mimeType:
                attachment.file?.type || getMimeTypeFromExtension(attachment.extension),
              sizeInBytes: attachment.file?.size || 1,
            })),
            selected: supplier.selected,
          } as PriceApprovalRequestSupplierDto)
      ),
    };
    return this._priceRequestsApprovalsClient
      .accept(
        this.priceRequestId,
        environment.apiVersion,
        request as ChangePriceApprovalRequestStatusDto
      )
      .pipe(first());
  }

  private acceptRequest(): void {
    this.callAccept()
      .pipe(
        concatMap(() => {
          this._toastr.success(
            this.translate.instant('termsDetails.requestAccepted'),
            '',
            {
              positionClass: 'toast-bottom-center',
            }
          );
          this.refreshRequest.emit(true);
          return of();
        })
      )
      .subscribe();
  }
  private acceptWithStorage(): void {
    this.callAccept()
      .pipe(
        concatMap(() => {
          this._toastr.success(
            this.translate.instant('termsDetails.requestAccepted'),
            '',
            {
              positionClass: 'toast-bottom-center',
            }
          );
          return forkJoin(
            this.uploadFileObs.length > 0 ? this.uploadFileObs : [of(null)]
          ).pipe(
            catchError((err) => {
              this.refreshRequest.emit(true);
              return of('err');
            })
          );
        }),
        concatMap((res) => {
          if (res !== 'err') {
            this.refreshRequest.emit(true);
          }
          return of();
        })
      )
      .subscribe();
  }

  sendSuppliersHandler(): void {
    const files: StorageFile[] = [];
    this.suppliers.forEach((supplier) => {
      if (
        supplier.attachments?.some(
          (attachment) => (attachment as FileAttachmentDto & { file: File }).file
        )
      ) {
        supplier.attachments.forEach((attachment) => {
          if (!(attachment as FileAttachmentDto & { file: any }).file) return;
          files.push({
            file: (attachment as FileAttachmentDto & { file: any }).file,
            displayName: attachment.displayName,
            uniqueKey: attachment.uniqueKey,
          } as StorageFile);
        });
      }
    });
    if (files.length) {
      this.uploadFileObs.push(
        this._termsDetailsService.upload(
          environment.apiVersion,
          files,
          AttachmentType.ProjectFiles.toString()
        )
      );
    }

    if (
      this.phase === this.priceApprovalRequestPhase.TechnicalOfficeReview ||
      this.phase === this.priceApprovalRequestPhase.PurchaseReview
    ) {
      this.acceptWithStorage();
    } else {
      this.acceptRequest();
    }
    return;
  }

  get showOtherOfferVisible() {
    return (
      (this.phase === this.priceApprovalRequestPhase.SupplierSelection &&
        this.userRoles.includes(this.role.ProjectsManager)) ||
      (this.phase === this.priceApprovalRequestPhase.TechnicalOfficeReview &&
        this.userRoles.includes(this.role.TechnicalOfficer)) ||
      (this.phase === this.priceApprovalRequestPhase.GeneralManagerReview &&
        this.userRoles.includes(this.role.GeneralManager))
    );
  }

  otherOfferHandler(): void {
    const currentPhaseToPhase: Partial<
      Record<PriceApprovalRequestPhase, PriceApprovalRequestPhase>
    > = {
      [PriceApprovalRequestPhase.TechnicalOfficeReview]:
        PriceApprovalRequestPhase.PurchaseReview,
      [PriceApprovalRequestPhase.SupplierSelection]:
        PriceApprovalRequestPhase.TechnicalOfficeReview,
      [PriceApprovalRequestPhase.GeneralManagerReview]:
        PriceApprovalRequestPhase.SupplierSelection,
    };
    const request = {
      suppliers: this.suppliers || [],
      notes: null,
      phase: currentPhaseToPhase[this.phase as PriceApprovalRequestPhase],
      status: PriceApprovalRequestStatus.WaitingNewSuppliers,
    } as ChangePriceApprovalRequestStatusDto;
    this._priceRequestsApprovalsClient
      .accept(
        this.priceRequestId,
        environment.apiVersion,
        request as ChangePriceApprovalRequestStatusDto
      )
      .pipe(
        first(),
        tap(() => this.refreshRequest.emit(true))
      )
      .subscribe();
  }

  get priceApprovalRequestPhase(): typeof PriceApprovalRequestPhase {
    return PriceApprovalRequestPhase;
  }

  get noSuppliersSelected(): boolean {
    return (
      this.phase === this.priceApprovalRequestPhase.SupplierSelection &&
      this.suppliers.every((s) => !s.selected)
    );
  }
}
