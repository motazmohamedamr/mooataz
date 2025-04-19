import {
  ChangeDetectorRef,
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
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AddSupplyRequestDialogComponent } from '../dialogs/add-supply-request-dialog/add-supply-request-dialog.component';
import { IdentityManager, User } from '@core/auth';
import {
  ChangeSupplyApprovalRequestStatusDto,
  IPageInfo,
  ISupplyApprovalRequestTransactionReqeustsDto,
  IUploadAttachmentDto,
  PaginatedListOfSupplyApprovalRequestDetailsVm,
  Role,
  SupplyApprovalRequestDetailsVm,
  SupplyApprovalRequestPhaseVm,
  SupplyApprovalRequestTransactionReqeustsDto,
  SupplyRequestsApprovalsClient,
} from '@core/api';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
import { ConfirmAcceptRejectDialogComponent } from '../dialogs/confirm-accept-reject-dialog/confirm-accept-reject-dialog.component';
import { TermsDetailsService } from '../terms-details.service';
import { AddTransactionDialogComponent } from '../dialogs/add-transaction-dialog/add-transaction-dialog.component';
import { ToastrService } from 'ngx-toastr';

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
  selector: 'app-supply-requests',
  templateUrl: './supply-requests.component.html',
  styleUrl: './supply-requests.component.scss',
})
export class SupplyRequestsComponent implements OnInit {
  private readonly _translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _supplyRequestsApprovalsClient = inject(SupplyRequestsApprovalsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _toastr = inject(ToastrService);
  private readonly router = inject(Router);

  user: User = null;

  private refetchSubject = new BehaviorSubject<void>(undefined);

  translation: any;

  termId: string = '';
  projectId: string = '';

  pageIndexSig = signal(0);
  requestId = signal(this.route.snapshot.queryParams?.requestId || undefined);
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

  private supplyRequestObs$ = toObservable(this.pageIndexSig).pipe(
    switchMap((pageIndex: number) => {
      return this.getDetailsPage(pageIndex);
    })
  );

  private requestObs$ = this.refetchSubject.pipe(
    switchMap(() => {
      if (this.requestId()) return this.getRequestDetail(this.requestId());
      return this.supplyRequestObs$;
    })
  );

  supplySig: Signal<SupplyApprovalRequestDetailsVm> = toSignal(
    this.requestObs$.pipe(
      tap((res) => {
        if (res instanceof PaginatedListOfSupplyApprovalRequestDetailsVm) {
          this.pageInfo.set(res.pageInfo);
        }
      }),
      map((value) => {
        if (value instanceof PaginatedListOfSupplyApprovalRequestDetailsVm) {
          return value.items && value.items.length > 0 ? value.items[0] : null;
        } else {
          return value as SupplyApprovalRequestDetailsVm;
        }
      })
    ),
    { initialValue: null, rejectErrors: true }
  );

  supplyRequest: Signal<WritableSignal<SupplyApprovalRequestDetailsVm>> = computed(() =>
    signal(this.supplySig())
  );
  supplyRequestSig = computed(() => this.supplyRequest()());

  async ngOnInit() {
    this.termId = this.route.parent.snapshot.params.termId;
    this.projectId = this.route.parent.snapshot.params.projectId;
    this.user = this._identityManager.getUser();
    this.translation = await firstValueFrom(
      this._translate.get('termsDetails.supplyRequests')
    );
    this.cdr.detectChanges();
  }

  get role(): typeof Role {
    return Role;
  }

  showAllRequests() {
    this.requestId.set(null);
    this.pageIndexSig.set(0);
    this.refetchSubject.next();

    const urlTree = this.router.parseUrl(this.router.url);
    delete urlTree.queryParams['requestId'];

    this.router.navigateByUrl(urlTree);
  }

  openAddRequestDialog() {
    const dialog = this.dialog.open(AddSupplyRequestDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation,
        termId: this.termId,
        projectId: this.projectId,
        termTitle: this._termsDetailsService.termDetails()?.title,
      },
    });

    dialog.afterClosed().subscribe((refetch: boolean) => {
      if (refetch) {
        if (this.pageInfo().totalCount === 0 || this.pageInfo().totalPages === 0) {
          this.refetchSubject.next();
          return;
        }
        this.pageInfo.update((info) => ({
          ...info,
          totalCount: this.pageInfo().totalCount + 1,
        }));
        this.pageIndexSig.set(this.pageInfo().totalCount + 1);
      }
    });
  }

  private getDetailsPage(
    pageIndex: number
  ): Observable<Partial<PaginatedListOfSupplyApprovalRequestDetailsVm>> {
    return this._supplyRequestsApprovalsClient
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
            items: [this.supplyRequestSig()],
            pageInfo: {
              totalCount: this.pageInfo().totalCount,
              totalPages: this.pageInfo().totalPages,
              init() {},
              toJSON() {},
            },
          });
        })
      );
  }

  private getRequestDetail(
    requestid: string
  ): Observable<SupplyApprovalRequestDetailsVm> {
    return this._supplyRequestsApprovalsClient
      .get(requestid, environment.apiVersion)
      .pipe(catchError(() => of(this.supplyRequestSig())));
  }

  openAcceptRejectDialog(status: 'accept' | 'reject'): void {
    const confirmDialog = this.dialog.open(ConfirmAcceptRejectDialogComponent, {
      minWidth: '600px',
      data: {
        translation: this.translation,
        notesAvailable:
          status === 'reject' ||
          (this.user.roles.includes(this.role.ProjectsManager) && status === 'accept') ||
          (this.user.roles.includes(this.role.GeneralManager) && status === 'accept'),
        notesNotRequired:
          this.user.roles.includes(this.role.ProjectsManager) ||
          this.user.roles.includes(this.role.GeneralManager),
        status,
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

      if (status === 'accept') {
        this.handleAccept(
          data.notes || null,
          data.attachments.map((att) => ({
            displayName: att.displayName,
            uniqueKey: att.uniqueKey,
            mimeType: att.mimeType,
            sizeInBytes: att.sizeInBytes,
          }))
        )
          .pipe(
            concatMap(() => {
              if (!data.attachments.length) {
                this.refreshRequest(true);
                return;
              }
              return forkJoin(
                this._termsDetailsService.uploadFiles(data.attachments)
              ).pipe(
                catchError((err) => {
                  this.refreshRequest(true);
                  return of(err);
                })
              );
            })
          )
          .subscribe(() => {
            this._toastr.success(
              this._translate.instant('termsDetails.requestAccepted'),
              '',
              {
                positionClass: 'toast-bottom-center',
              }
            );
            this.refreshRequest(true);
          });
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
                  this.refreshRequest();
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
    attachments: IUploadAttachmentDto[] = []
  ): Observable<void> {
    return this._supplyRequestsApprovalsClient.accept(
      this.supplyRequestSig().id,
      environment.apiVersion,
      { notes, attachments } as ChangeSupplyApprovalRequestStatusDto
    );
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

  private handleReject(
    notes: string = null,
    attachments: IUploadAttachmentDto[] = []
  ): Observable<void> {
    return this._supplyRequestsApprovalsClient.reject(
      this.supplyRequestSig().id,
      environment.apiVersion,
      { notes, attachments } as ChangeSupplyApprovalRequestStatusDto
    );
  }

  openAddTransactionDialog(): void {
    const dialog = this.dialog.open(AddTransactionDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation?.transactions,
        requestId: this.supplyRequestSig().id,
        supplierId: this.supplyRequestSig()?.suppliers[0]?.supplierId,
        lastRemainingAmount:
          this.supplyRequestSig()?.transactionReqeusts?.length > 0
            ? this.supplyRequestSig().transactionReqeusts[
                this.supplyRequestSig().transactionReqeusts.length - 1
              ].remaining
            : this.supplyRequestSig().totalWithVat,
      },
    });

    dialog
      .afterClosed()
      .subscribe(
        (transactionFormValue: ISupplyApprovalRequestTransactionReqeustsDto | null) => {
          if (transactionFormValue) {
            const request = {
              supplyApprovalRequestId: transactionFormValue.supplyApprovalRequestId,
              transactionRequests: transactionFormValue.transactionRequests.map(
                (req) => ({
                  supplierId: req.supplierId,
                  date: req.date,
                  amount: req.amount,
                })
              ),
            } as SupplyApprovalRequestTransactionReqeustsDto;
            this._supplyRequestsApprovalsClient
              .addTransactionRequests(environment.apiVersion, request)
              .subscribe((res) => {
                this.refreshRequest();
              });
          }
        }
      );
  }

  protected get phase(): typeof SupplyApprovalRequestPhaseVm {
    return SupplyApprovalRequestPhaseVm;
  }

  protected get enableAcceptRejectBtns(): boolean {
    return (
      (this.supplyRequestSig().phase === this.phase.GeneralManagerReview &&
        this.user.roles.includes(this.role.GeneralManager) &&
        this.supplyRequestSig().status === 0) ||
      (this.supplyRequestSig().phase === this.phase.ProjectManagerReview &&
        this.user.roles.includes(this.role.ProjectManager) &&
        this.supplyRequestSig().status === 0) ||
      (this.supplyRequestSig().phase === this.phase.ProjectsManagerReview &&
        this.user.roles.includes(this.role.ProjectsManager) &&
        this.supplyRequestSig().status === 0)
    );
  }
  goToPageHandler(page: number) {
    this.pageIndexSig.set(page);
  }
}
