import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  first,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AddPriceRequestDialogComponent } from './add-price-request-dialog/add-price-request-dialog.component';
import {
  ChangePriceApprovalRequestStatusDto,
  IPageInfo,
  IUploadAttachmentDto,
  PriceApprovalRequestDetailsVm,
  PriceApprovalRequestPhase,
  PriceApprovalRequestPhaseVm,
  PriceApprovalRequestStatusVm,
  PriceApprovalRequestSupplierDto,
  PriceApprovalRequestSupplierVm,
  PriceRequestsApprovalsClient,
  Role,
  UploadAttachmentDto,
} from '@core/api';
import { environment } from '@env/environment';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { ActivatedRoute } from '@angular/router';
import { IdentityManager, User } from '@core/auth';
import { ConfirmAcceptRejectDialogComponent } from '../dialogs/confirm-accept-reject-dialog/confirm-accept-reject-dialog.component';
import { AddSupplerDialogComponent } from './add-suppler-dialog/add-suppler-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { TermsDetailsService } from '../terms-details.service';

type ConfirmResponse = {
  notes: string | null;
  attachments: {
    uniqueKey: string;
    displayName: string;
    mimeType: string;
    sizeInBytes: number;
  }[];
};
@Component({
  selector: 'app-price-requests',
  templateUrl: './price-requests.component.html',
  styleUrl: './price-requests.component.scss',
})
export class PriceRequestsComponent implements OnInit {
  private readonly _translate = inject(TranslateService);
  private readonly _identityManager = inject(IdentityManager);
  private readonly dialog = inject(MatDialog);
  private readonly _priceRequestsApprovalsClient = inject(PriceRequestsApprovalsClient);
  private readonly route = inject(ActivatedRoute);
  private readonly _toastr = inject(ToastrService);
  private readonly _termsDetailsService = inject(TermsDetailsService);

  user: User = null;

  private refetchSubject = new BehaviorSubject<void>(undefined);

  translation: any;

  termId: string = '';
  projectId: string = '';

  pageIndexSig = signal(0);
  pageInfo: WritableSignal<IPageInfo> = signal({
    sortingBy: undefined,
    ascending: true,
    pageIndex: 0,
    totalPages: 0,
    totalCount: 0,
  });
  paginationPages = computed(() => {
    return Array.from({ length: this.pageInfo().totalPages }, (_, i) => i + 1);
  });

  priceApprovalStatusBadges: any = null;

  private priceRequestObs$ = toObservable(this.pageIndexSig).pipe(
    switchMap((pageIndex: number) => {
      return this.getDetailsPage(pageIndex);
    })
  );

  private requestObs$ = this.refetchSubject.pipe(switchMap(() => this.priceRequestObs$));

  priceSig: Signal<PriceApprovalRequestDetailsVm> = toSignal(
    this.requestObs$.pipe(
      tap((res) => {
        this.pageInfo.set(res.pageInfo);
      }),
      map((value) => {
        return value.items && value.items.length > 0 ? value.items[0] : null;
      })
    ),
    { initialValue: null, rejectErrors: true }
  );

  pricerequest: Signal<WritableSignal<PriceApprovalRequestDetailsVm>> = computed(() =>
    signal(this.priceSig())
  );
  priceRequestSig = computed(() => this.pricerequest()());

  async ngOnInit() {
    this.termId = this.route.parent.snapshot.params.termId;
    this.projectId = this.route.parent.snapshot.params.projectId;
    this.user = this._identityManager.getUser();

    this.translation = await firstValueFrom(
      this._translate.get('termsDetails.priceRequests')
    );
    this.priceApprovalStatusBadges = {
      [PriceApprovalRequestStatusVm.Pending]: new BadgeItem(
        this.translation.priceApprovalStatus.Pending,
        'badge-light-warning'
      ),
      [PriceApprovalRequestStatusVm.ClientRejected]: new BadgeItem(
        this.translation.priceApprovalStatus.ClientRejected,
        'badge-light-danger'
      ),
      [PriceApprovalRequestStatusVm.ClientReview]: new BadgeItem(
        this.translation.priceApprovalStatus.ClientReview,
        'badge-light-warning'
      ),
      [PriceApprovalRequestStatusVm.Approved]: new BadgeItem(
        this.translation.priceApprovalStatus.Approved,
        'badge-light-success'
      ),
      [PriceApprovalRequestStatusVm.Rejected]: new BadgeItem(
        this.translation.priceApprovalStatus.Rejected,
        'badge-light-danger'
      ),
      [PriceApprovalRequestStatusVm.WaitingNewSuppliers]: new BadgeItem(
        this.translation.priceApprovalStatus.WaitingNewSuppliers,
        'badge-light-warning'
      ),
    };
  }

  openAddRequestDialog() {
    const dialog = this.dialog.open(AddPriceRequestDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation,
        termId: this.termId,
        projectId: this.projectId,
        measurementUnitId: this._termsDetailsService.termDetails()?.measurementUnitId,
      },
    });

    dialog.afterClosed().subscribe((refetch: boolean) => {
      if (refetch) {
        if (this.pageInfo().totalCount === 0) {
          this.refetchSubject.next();
          return;
        }
        this.pageInfo.update((info) => ({
          ...info,
          totalCount: this.pageInfo().totalCount + 1,
        }));
        this.pageIndexSig.set(
          this.user.roles.includes(Role.SiteEngineer)
            ? this.pageInfo().totalCount - 1
            : this.pageInfo().totalCount
        );
      }
    });
  }

  private getDetailsPage(pageIndex: number): Observable<any> {
    return this._priceRequestsApprovalsClient
      .getDetailsPage(
        1,
        pageIndex,
        undefined,
        undefined,
        undefined,
        this.termId,
        environment.apiVersion
      )
      .pipe(
        catchError(() => {
          this.pageIndexSig.set(this.pageInfo().pageIndex);
          return of({
            items: [this.priceRequestSig()],
            pageInfo: {
              totalCount: this.pageInfo().totalCount,
              totalPages: this.pageInfo().totalPages,
            },
          });
        })
      );
  }

  goToPageHandler(page: number) {
    this.pageIndexSig.set(page);
  }

  get role(): typeof Role {
    return Role;
  }

  // done by project manager only
  openAcceptRejectDialog(status: 'accept' | 'reject'): void {
    const confirmDialog = this.dialog.open(ConfirmAcceptRejectDialogComponent, {
      minWidth: '600px',
      data: {
        translation: this.translation,
        status,
        notesAvailable:
          status === 'reject' ||
          (this.user.roles.includes(this.role.ProjectsManager) && status === 'accept'),
        title:
          status === 'accept'
            ? this._translate.instant('termsDetails.confirmAcceptTitle')
            : this._translate.instant('termsDetails.confirmRejectTitle'),
        subtitle:
          status === 'accept'
            ? this.translation.confirmConfirmSubtitle
            : this.translation.confirmRejectSubtitle,
        yesBtnText:
          status === 'accept'
            ? this._translate.instant('termsDetails.yes_acceptButton')
            : this._translate.instant('termsDetails.yes_rejectButton'),
        noBtnText:
          status === 'accept'
            ? this._translate.instant('termsDetails.no_rejectButton')
            : this._translate.instant('termsDetails.no_acceptButton'),
      },
    });

    confirmDialog.afterClosed().subscribe((data: ConfirmResponse | null) => {
      if (!data) return;

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

      if (status === 'accept') {
        this.handleAccept(
          null,
          currentPhaseToPhase[this.priceRequestSig().phase] || null,
          data.attachments.map((att) => ({
            displayName: att.displayName,
            uniqueKey: att.uniqueKey,
            mimeType: att.mimeType,
            sizeInBytes: att.sizeInBytes,
          }))
        )
          .pipe(
            concatMap(() => {
              this._toastr.success(
                this._translate.instant('termsDetails.requestAccepted'),
                '',
                {
                  positionClass: 'toast-bottom-center',
                }
              );
              if (!data.attachments.length) {
                this.refreshRequest(true);
                return;
              }
              return forkJoin(
                this._termsDetailsService.uploadFiles(data.attachments)
              ).pipe(
                catchError((err) => {
                  return of(err);
                })
              );
            })
          )
          .subscribe(() => this.refreshRequest(true));
      } else {
        this.handleReject(
          data.notes,
          data.attachments.map((att) => ({
            displayName: att.displayName,
            uniqueKey: att.uniqueKey,
            mimeType: att.mimeType,
            sizeInBytes: att.sizeInBytes,
          }))
        )
          .pipe(
            concatMap(() => {
              this._toastr.success(
                this._translate.instant('termsDetails.requestRejected'),
                '',
                {
                  positionClass: 'toast-bottom-center',
                }
              );
              if (!data.attachments.length) {
                this.refreshRequest();
                return;
              }
              return forkJoin(
                this._termsDetailsService.uploadFiles(data.attachments)
              ).pipe(
                catchError((err) => {
                  return of(err);
                })
              );
            })
          )
          .subscribe(() => this.refreshRequest());
      }
    });
  }

  private handleAccept(
    notes: string = null,
    phase: number = null,
    attachments: IUploadAttachmentDto[] = [],
    suppliers: PriceApprovalRequestSupplierDto[] | null = []
  ): Observable<void> {
    return this._priceRequestsApprovalsClient.accept(
      this.priceRequestSig().id,
      environment.apiVersion,
      { notes, suppliers, phase, attachments } as ChangePriceApprovalRequestStatusDto
    );
  }

  private handleReject(
    notes: string = null,
    attachments: IUploadAttachmentDto[] = [],
    suppliers: PriceApprovalRequestSupplierDto[] | null = []
  ): Observable<void> {
    return this._priceRequestsApprovalsClient.reject(
      this.priceRequestSig().id,
      environment.apiVersion,
      { notes, attachments, suppliers } as ChangePriceApprovalRequestStatusDto
    );
  }

  openSupplierDialog() {
    const addSupplierDialog = this.dialog.open(AddSupplerDialogComponent, {
      width: '600px',
      data: {
        translation: this.translation,
        existingSuppliers: this.priceRequestSig().suppliers.map((s) => s.supplierId),
      },
    });

    addSupplierDialog
      .afterClosed()
      .pipe(first())
      .subscribe((data: PriceApprovalRequestSupplierDto & { supplierName: string }) => {
        if (!data) return;

        const foundSupplierIdx = this.priceRequestSig().suppliers.findIndex(
          (su) => su.supplierId === data.supplierId
        );
        if (foundSupplierIdx >= 0) {
          this._toastr.error(this.translation.supplierAlreadyAdded, '', {
            positionClass: 'toast-bottom-center',
          });
          return;
        }
        const newSupplier = {
          selected: data.selected,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          attachments:
            !data.attachments || data.attachments.length === 0
              ? []
              : data.attachments.map((attachment) => ({
                  displayName: attachment.displayName,
                  extension:
                    attachment.displayName.split('.')[
                      attachment.displayName.split('.').length - 1
                    ],
                  uniqueName: attachment.displayName,
                  uniqueKey: attachment.uniqueKey,
                  mimeType: attachment.mimeType,
                  url: '',
                  file: (attachment as UploadAttachmentDto & { file: File }).file,
                })),
        } as PriceApprovalRequestSupplierVm | any;
        this.pricerequest().update(
          (request) =>
            ({
              ...request,
              suppliers: [...request.suppliers, newSupplier],
            } as PriceApprovalRequestDetailsVm)
        );
      });
  }

  refreshRequest(fetchBefore: boolean = false): void {
    if (fetchBefore) {
      if (
        this.pageIndexSig() > 0 &&
        this.pageIndexSig() === this.pageInfo().totalPages - 1
      ) {
        this.pageIndexSig.set(this.pageIndexSig() - 1);
      } else {
        this.refetchSubject.next();
      }
    } else {
      this.refetchSubject.next();
    }
  }

  get enableOpenAddSupplierBtn(): boolean {
    return (
      (this.priceRequestSig().phase === PriceApprovalRequestPhaseVm.PurchaseReview &&
        this.user.roles.includes(Role.Purchasing)) ||
      (this.priceRequestSig().phase ===
        PriceApprovalRequestPhaseVm.TechnicalOfficeReview &&
        this.user.roles.includes(Role.TechnicalOfficer))
    );
  }

  deleteSupplier(supplierId: string) {
    this.pricerequest().update((request) => ({
      ...request,
      init(_data) {},
      toJSON(data) {},
      suppliers: request.suppliers.filter((s) => s.supplierId !== supplierId),
    }));
  }
}
