import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityManager, User } from '@core/auth';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { MatDialog } from '@angular/material/dialog';
import { AddContractDataDialogComponent } from './dialogs/add-contract-data-dialog/add-contract-data-dialog.component';
import { ExtractRequestDetailsVm, ExtractRequestsClient, IPageInfo } from '@core/api';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { of } from 'rxjs/internal/observable/of';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { TermsDetailsService } from '../terms-details.service';
import { TermsExtractsService } from './terms-extracts.service';

@Component({
  selector: 'app-terms-extracts',
  templateUrl: './terms-extracts.component.html',
  styleUrl: './terms-extracts.component.scss',
})
export class TermsExtractsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly _extractRequestsClient = inject(ExtractRequestsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _termsExtractsService = inject(TermsExtractsService);
  private readonly router = inject(Router);

  private refetchSubject = new BehaviorSubject<void>(undefined);

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
  private extractListObs$ = toObservable(this.pageIndexSig).pipe(
    switchMap((pageIndex: number) => {
      return this.getDetailsPage(pageIndex);
    })
  );

  private requestObs$ = this.refetchSubject.pipe(switchMap(() => this.extractListObs$));

  extractListSig: Signal<ExtractRequestDetailsVm[]> = toSignal(
    this.requestObs$.pipe(
      tap((res) => {
        this.pageInfo.set(res.pageInfo);
      }),
      map((value) => {
        return value.items || [];
      })
    ),
    { initialValue: [], rejectErrors: true }
  );

  extractList: Signal<WritableSignal<ExtractRequestDetailsVm[]>> = computed(() =>
    signal(this.extractListSig())
  );
  extractListSignal = computed(() => this.extractList()());

  user: User = null;

  termId: string = '';
  projectId: string = '';

  translation: any;

  detailsOfExtract: WritableSignal<ExtractRequestDetailsVm> = signal(null);

  lastExtract: ExtractRequestDetailsVm = null;

  async ngOnInit(): Promise<void> {
    this.termId = this.route.parent.snapshot.params.termId;
    this.projectId = this.route.parent.snapshot.params.projectId;
    this.user = this._identityManager.getUser();
    this.translation = await firstValueFrom(this._translate.get('termsDetails.extracts'));
    try {
      this.lastExtract = await firstValueFrom(
        this._extractRequestsClient.getLastByTermId(this.termId, environment.apiVersion)
      );
      this._termsExtractsService.lastRequest.set(this.lastExtract);
    } catch {
      this._termsExtractsService.lastRequest.set(null);
    }
  }

  goToPageHandler(page: number) {
    this.pageIndexSig.set(page);
  }

  private getDetailsPage(pageIndex: number) {
    return this._extractRequestsClient
      .getDetailsPage(
        5,
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
            items: this.extractListSignal(),
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

  openAddRequestDialog() {
    const dialog = this.dialog.open(AddContractDataDialogComponent, {
      minWidth: '700px',
      maxHeight: '90vh',
      data: {
        translationAddContractDetailModal: this.translation.addContractDetailsModal,
        translationAddExtractModal: this.translation.addExtractModal,
        termId: this.termId,
        projectId: this.projectId,
        projectName: this._termsDetailsService.termDetails()?.projectName,
        itemNumber: this._termsDetailsService.termDetails()?.itemNumber,
        lastExtract: this.lastExtract,
      },
    });

    dialog.afterClosed().subscribe((newRequestId: string) => {
      if (newRequestId) {
        this.router.navigate([newRequestId], {
          relativeTo: this.route,
        });
        this.refetchSubject.next();
      }
    });
  }

  goToDetails(extract: ExtractRequestDetailsVm) {
    this._termsExtractsService.detailsOfExtract.set(extract);
    this.router.navigate([extract.id], {
      relativeTo: this.route,
    });
  }

  ngOnDestroy(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('requestId');
    window.history.replaceState({}, '', url.toString());
    this._termsExtractsService.detailsOfExtract.set(null);
  }
}
