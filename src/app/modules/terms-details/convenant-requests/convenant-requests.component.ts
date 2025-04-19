import { AddConvenantRequestDialogComponent } from './add-convenant-request-dialog/add-convenant-request-dialog.component';
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
import { ActivatedRoute } from '@angular/router';
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
import { AddTransactionDialogComponent } from '../dialogs/add-transaction-dialog/add-transaction-dialog.component';
import { ConfirmAcceptRejectDialogComponent } from '../dialogs/confirm-accept-reject-dialog/confirm-accept-reject-dialog.component';
import { IdentityManager, User } from '@core/auth';
import {
  ChangeCovenantRequestStatusDto,
  CovenantRequestDetailsVm,
  CovenantRequestPhaseVm,
  CovenantRequestsClient,
  CovenantTransactionRequestDto,
  CovenantTransactionRequestVm,
  IPageInfo,
  ISupplyApprovalRequestTransactionReqeustsDto,
  IUploadAttachmentDto,
  PaginatedListOfCovenantRequestDetailsVm,
  Role,
  SupplyApprovalRequestTransactionRequestDto,
} from '@core/api';
import { TermsDetailsService } from '../terms-details.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
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
  selector: 'app-convenant-requests',
  templateUrl: './convenant-requests.component.html',
  styleUrl: './convenant-requests.component.scss',
})
export class ConvenantRequestsComponent implements OnInit {
  private readonly _translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _covenantRequestsClient = inject(CovenantRequestsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _toastr = inject(ToastrService);

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

  private covenantRequestObs$ = toObservable(this.pageIndexSig).pipe(
    switchMap((pageIndex: number) => {
      return this.getDetailsPage(pageIndex);
    })
  );

  private requestObs$ = this.refetchSubject.pipe(
    switchMap(() => this.covenantRequestObs$)
  );

  covenantSig: Signal<CovenantRequestDetailsVm> = toSignal(
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

  covenantRequest: Signal<WritableSignal<CovenantRequestDetailsVm>> = computed(() =>
    signal(this.covenantSig())
  );
  covenantRequestSig = computed(() => this.covenantRequest()());
  transactionsSig: WritableSignal<CovenantTransactionRequestVm[]> = signal([]);

  async ngOnInit() {
    this.termId = this.route.parent.snapshot.params.termId;
    this.projectId = this.route.parent.snapshot.params.projectId;
    this.user = this._identityManager.getUser();
    this.translation = await firstValueFrom(
      this._translate.get('termsDetails.custodyRequests')
    );
  }

  get role(): typeof Role {
    return Role;
  }

  openAddConvenantRequestDialog() {
    const dialog = this.dialog.open(AddConvenantRequestDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation.modal,
        termId: this.termId,
        projectId: this.projectId,
        termTitle: this._termsDetailsService.termDetails()?.title,
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
        this.pageIndexSig.set(this.pageInfo().totalCount + 1);
      }
    });
  }

  private getDetailsPage(
    pageIndex: number
  ): Observable<Partial<PaginatedListOfCovenantRequestDetailsVm>> {
    return this._covenantRequestsClient
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
        tap((res) => {
          if (res && res.items && res.items.length > 0) {
            this._covenantRequestsClient
              .getTransactionsPage(
                undefined,
                0,
                undefined,
                undefined,
                undefined,
                res.items[0].id,
                environment.apiVersion
              )
              .subscribe((transactionInfo) => {
                this.transactionsSig.set(transactionInfo.items);
              });
          }
        }),
        catchError(() => {
          this.pageIndexSig.set(this.pageInfo().pageIndex);
          return of({
            items: [this.covenantRequestSig()],
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

  openAcceptRejectDialog(status: 'accept' | 'reject'): void {
    const confirmDialog = this.dialog.open(ConfirmAcceptRejectDialogComponent, {
      minWidth: '600px',
      data: {
        translation: this.translation,
        status,
        notesAvailable:
          status === 'reject' ||
          (this.user.roles.includes(this.role.ProjectsManager) && status === 'accept') ||
          (this.user.roles.includes(this.role.GeneralManager) && status === 'accept'),
        notesNotRequired:
          this.user.roles.includes(this.role.ProjectsManager) ||
          this.user.roles.includes(this.role.GeneralManager),
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
    return this._covenantRequestsClient.accept(
      this.covenantRequestSig().id,
      environment.apiVersion,
      { notes, attachments } as ChangeCovenantRequestStatusDto
    );
  }

  refreshRequest(fetchBefore: boolean = false): void {
    if (fetchBefore) {
      if (this.pageIndexSig() && this.pageIndexSig() === this.pageInfo().totalPages - 1) {
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
    return this._covenantRequestsClient.reject(
      this.covenantRequestSig().id,
      environment.apiVersion,
      { notes, attachments } as ChangeCovenantRequestStatusDto
    );
  }

  openAddTransactionDialog(): void {
    const dialog = this.dialog.open(AddTransactionDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation?.transactions,
        requestId: this.covenantRequestSig().id,
        lastRemainingAmount:
          this.transactionsSig().length > 0
            ? this.transactionsSig()[this.transactionsSig().length - 1].remain
            : this.covenantRequestSig().totalPriceWithVat,
      },
    });

    dialog
      .afterClosed()
      .subscribe(
        (transactionFormValue: ISupplyApprovalRequestTransactionReqeustsDto | null) => {
          const arr = transactionFormValue.transactionRequests.map((request) => ({
            covenantRequestId: this.covenantRequestSig().id,
            date: request.date,
            amount: request.amount,
            remain: (<any>request).remain,
          })) as CovenantTransactionRequestDto[];
          if (transactionFormValue) {
            this._covenantRequestsClient
              .addTransactionRequests(environment.apiVersion, arr)
              .subscribe((res) => {
                this.refreshRequest();
              });
          }
        }
      );
  }

  protected get phase(): typeof CovenantRequestPhaseVm {
    return CovenantRequestPhaseVm;
  }

  protected get enableRateBtns(): boolean {
    return (
      (this.covenantRequestSig().phase === this.phase.TechnicalOfficeReview &&
        this.user.roles.includes(this.role.TechnicalOfficer) &&
        this.covenantRequestSig().status === 0) ||
      (this.covenantRequestSig().phase === this.phase.GeneralManagerReview &&
        this.user.roles.includes(this.role.GeneralManager) &&
        this.covenantRequestSig().status === 0) ||
      (this.covenantRequestSig().phase === this.phase.ProjectsManagerReview &&
        this.user.roles.includes(this.role.ProjectsManager) &&
        this.covenantRequestSig().status === 0)
    );
  }

  goToPageHandler(page: number) {
    this.pageIndexSig.set(page);
  }
}
