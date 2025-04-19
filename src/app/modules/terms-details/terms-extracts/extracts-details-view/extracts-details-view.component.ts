import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ChangeExtractRequestStatusDto,
  ExtractRequestCalculateDto,
  ExtractRequestDeductionCalculateVm,
  ExtractRequestDeductionDto,
  ExtractRequestDetailsCalculateVm,
  ExtractRequestDetailsVm,
  ExtractRequestPhaseVm,
  ExtractRequestsClient,
  ExtractRequestStatusVm,
  ExtractRequestTransactionReqeustsDto,
  ExtractRequestUpdateDto,
  ISupplyApprovalRequestTransactionReqeustsDto,
  IUploadAttachmentDto,
  MeasurementUnitsClient,
  MeasurementUnitVm,
  Role,
} from '@core/api';
import { IdentityManager, User } from '@core/auth';
import { environment } from '@env/environment';
import { AddTransactionDialogComponent } from '@modules/terms-details/dialogs/add-transaction-dialog/add-transaction-dialog.component';
import { ConfirmAcceptRejectDialogComponent } from '@modules/terms-details/dialogs/confirm-accept-reject-dialog/confirm-accept-reject-dialog.component';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import {
  catchError,
  concatMap,
  first,
  firstValueFrom,
  forkJoin,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { AddDiscountDialogComponent } from '../dialogs/add-discount-dialog/add-discount-dialog.component';
import { TermsExtractsService } from '../terms-extracts.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  selector: 'app-extracts-details-view',
  templateUrl: './extracts-details-view.component.html',
  styleUrl: './extracts-details-view.component.scss',
})
export class ExtractsDetailsViewComponent implements OnInit, OnDestroy {
  private readonly _extractRequestsClient = inject(ExtractRequestsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _termsExtractService = inject(TermsExtractsService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly _translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly _identityManager = inject(IdentityManager);
  private readonly dialog = inject(MatDialog);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  destroyRef = inject(DestroyRef);

  measurementUnits: MeasurementUnitVm[] = [];

  requestId: string;
  extractDetailsSig: WritableSignal<ExtractRequestDetailsVm> =
    this._termsExtractService.detailsOfExtract;
  lastExtract = this._termsExtractService.lastRequest;

  totalQuantity: number | null = null;
  translation: any;

  termId: string;
  projectId: string;
  user: User;

  async ngOnInit(): Promise<void> {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (params) => {
        this.requestId = params.get('requestId');
        const isNotification = this.route.snapshot.queryParams.notification;
        if (!this.extractDetailsSig() || isNotification) {
          this.extractDetailsSig.set(
            await firstValueFrom(
              this._extractRequestsClient.get(this.requestId, environment.apiVersion)
            )
          );
        }
        if (!this.lastExtract() || isNotification) {
          try {
            this.lastExtract.set(
              await firstValueFrom(
                this._extractRequestsClient.getLastByTermId(
                  this.termId,
                  environment.apiVersion
                )
              )
            );
          } catch {
            this.lastExtract.set(null);
          }
        }
      });
    this.termId = this.route.parent.snapshot.params.termId;
    this.projectId = this.route.parent.snapshot.params.projectId;

    this.user = this._identityManager.getUser();
    this.translation = await firstValueFrom(this._translate.get('termsDetails.extracts'));
    this.measurementUnits = await firstValueFrom(
      this._measurementUnitsClient.getAll(environment.apiVersion)
    );
  }

  get role(): typeof Role {
    return Role;
  }
  get extractStatus(): typeof ExtractRequestStatusVm {
    return ExtractRequestStatusVm;
  }
  get phase(): typeof ExtractRequestPhaseVm {
    return ExtractRequestPhaseVm;
  }
  goToList() {
    this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParams: { notification: null },
      queryParamsHandling: 'merge',
    });
  }

  private handleReject(
    notes: string = null,
    attachments: IUploadAttachmentDto[] = []
  ): Observable<void> {
    return this._extractRequestsClient.reject(this.requestId, environment.apiVersion, {
      notes,
      attachments,
    } as ChangeExtractRequestStatusDto);
  }

  updateExtract(totalQuantity: number, accredited: boolean) {
    const requestDto = {
      isSubmit: accredited,
      totalQuantity: this.totalQuantity || totalQuantity,
      deductions: this.extractDetailsSig().deductions || [],
    } as ExtractRequestUpdateDto;
    this._extractRequestsClient
      .update(this.requestId, environment.apiVersion, requestDto)
      .subscribe(() => {
        this.toastr.success(
          accredited ? this.translation.extractAccredited : this.translation.extractSaved,
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
        this.goToList();
      });
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
                this.goToList();
                return;
              }
              return forkJoin(
                this._termsDetailsService.uploadFiles(data.attachments)
              ).pipe(
                catchError((err) => {
                  this.goToList();
                  return of(err);
                })
              );
            })
          )
          .subscribe(() => {
            this.toastr.success(
              this._translate.instant('termsDetails.requestAccepted'),
              '',
              {
                positionClass: 'toast-bottom-center',
              }
            );
            this.goToList();
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
              this.toastr.success(
                this._translate.instant('termsDetails.requestRejected'),
                '',
                {
                  positionClass: 'toast-bottom-center',
                }
              );
              if (!data.attachments.length) {
                this.goToList();
                return;
              }
              return forkJoin(
                this._termsDetailsService.uploadFiles(data.attachments)
              ).pipe(
                catchError((err) => {
                  this.goToList();
                  return of(err);
                })
              );
            })
          )
          .subscribe(() => this.goToList());
      }
    });
  }

  private handleAccept(
    notes: string = null,
    attachments: IUploadAttachmentDto[] = []
  ): Observable<void> {
    return this._extractRequestsClient.accept(this.requestId, environment.apiVersion, {
      notes,
      attachments,
    } as ChangeExtractRequestStatusDto);
  }

  private updateAfterCalculate(calculateResult: ExtractRequestDetailsCalculateVm) {
    this.extractDetailsSig.update(
      (extract) =>
        ({
          ...extract,
          deductions: calculateResult.deductions.map((ded) => {
            const measurementUnit = this.measurementUnits.find(
              (mu) => mu.id === ded.measurementUnitId
            );
            return {
              ...ded,
              measurementUnit: this.measurementUnits.find(
                (mu) => mu.id === ded.measurementUnitId
              ),
            } as ExtractRequestDeductionCalculateVm & { measurementUnit: any };
          }),
          totalAfterDeductions: calculateResult.totalAfterDeductions,
          totalAfterDeductionsWithVat: calculateResult.totalAfterDeductionsWithVat,
          vatAmount: calculateResult.vatAmount,
          tenPercentDeduction: calculateResult.tenPercentDeduction,
          totalPaidBefore: calculateResult.totalPaidBefore,
          extractValue: calculateResult.extractValue,
          unitPrice: calculateResult.unitPrice,
          total: calculateResult.total,
          totalQuantity: calculateResult.totalQuantity,
          previousQuantity: calculateResult.previousQuantity,
          currentQuantity: calculateResult.currentQuantity,
          quantity: calculateResult.quantity,
        } as ExtractRequestDetailsVm)
    );
  }

  private calculateThenUpdate(calculateDto: ExtractRequestCalculateDto) {
    this._extractRequestsClient
      .calculate(this.requestId, environment.apiVersion, calculateDto)
      .pipe(first())
      .subscribe((calculateResult: ExtractRequestDetailsCalculateVm) =>
        this.updateAfterCalculate(calculateResult)
      );
  }

  refreshRequest() {
    this._extractRequestsClient
      .get(this.requestId, environment.apiVersion)
      .pipe(first())
      .subscribe((resp) => {
        this.extractDetailsSig.set(resp);
      });
  }

  openAddDiscountDialog() {
    const addDiscountDialog = this.dialog.open(AddDiscountDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translation.discounts,
        measurementUnits: this.measurementUnits,
      },
    });

    addDiscountDialog
      .afterClosed()
      .pipe(
        switchMap((res: Partial<ExtractRequestCalculateDto>) => {
          if (!res) return of(null);
          const deductionRequestDto = {
            id: '',
            ...res,
          } as ExtractRequestDeductionDto;

          const calculateDto = {
            deductions: [...this.extractDetailsSig().deductions, deductionRequestDto],
            totalQuantity: this.extractDetailsSig().totalQuantity,
          } as ExtractRequestCalculateDto;

          return this._extractRequestsClient.calculate(
            this.requestId,
            environment.apiVersion,
            calculateDto
          );
        })
      )
      .subscribe((calculateResult: ExtractRequestDetailsCalculateVm) => {
        this.updateAfterCalculate(calculateResult);
      });
  }

  openAddTransactionDialog(): void {
    const dialog = this.dialog.open(AddTransactionDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      minHeight: '400px',
      data: {
        translation: this.translation?.transactions,
        requestId: this.requestId,
        supplierId: this.extractDetailsSig().supplierId,
        lastRemainingAmount:
          this.extractDetailsSig()?.transactionReqeusts?.length > 0
            ? this.extractDetailsSig().transactionReqeusts[
                this.extractDetailsSig().transactionReqeusts.length - 1
              ].remaining
            : this.extractDetailsSig().extractValue,
      },
    });

    dialog
      .afterClosed()
      .subscribe(
        (transactionFormValue: ISupplyApprovalRequestTransactionReqeustsDto | null) => {
          if (transactionFormValue) {
            const request = {
              extractRequestId: transactionFormValue.supplyApprovalRequestId,
              transactionRequests: transactionFormValue.transactionRequests.map(
                (req) => ({
                  date: req.date,
                  amount: req.amount,
                })
              ),
            } as ExtractRequestTransactionReqeustsDto;
            this._extractRequestsClient
              .addTransactionRequests(environment.apiVersion, request)
              .pipe(
                switchMap(() =>
                  this._extractRequestsClient.get(this.requestId, environment.apiVersion)
                )
              )
              .subscribe((resp) => {
                this.extractDetailsSig.set(resp);
              });
          }
        }
      );
  }

  totalQuantityFromDiscountChange(obj: { value: number; index: number }) {
    const deductions = this.extractDetailsSig().deductions;
    deductions[obj.index].totalQuantity = obj.value;
    const calculateDto = {
      deductions,
      totalQuantity: this.extractDetailsSig().totalQuantity,
    } as ExtractRequestCalculateDto;

    this.calculateThenUpdate(calculateDto);
  }

  unitPriceFromDiscountChange(obj: { value: number; index: number }) {
    const deductions = this.extractDetailsSig().deductions;
    deductions[obj.index].unitPrice = obj.value;
    const calculateDto = {
      deductions,
      totalQuantity: this.extractDetailsSig().totalQuantity,
    } as ExtractRequestCalculateDto;
    this.calculateThenUpdate(calculateDto);
  }

  totalQuantityChange(value: number) {
    this.extractDetailsSig.update(
      (det) => ({ ...det, totalQuantity: value } as ExtractRequestDetailsVm)
    );
    const calculateDto = {
      deductions: this.extractDetailsSig().deductions,
      totalQuantity: value,
    } as ExtractRequestCalculateDto;
    this.calculateThenUpdate(calculateDto);
  }

  ngOnDestroy(): void {
    this._termsExtractService.detailsOfExtract.set(null);
  }
}
