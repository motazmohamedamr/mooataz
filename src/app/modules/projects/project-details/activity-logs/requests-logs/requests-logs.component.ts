import {
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  OnInit,
  Signal,
  signal,
  SimpleChanges,
  WritableSignal,
} from '@angular/core';
import {
  AccountsClient,
  ActivitiesClient,
  IPageInfo,
  RequestActivityViewVM,
} from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { getDateRange } from '@modules/contracts/shared/utils/date-range';

@Component({
  selector: 'app-requests-logs',
  templateUrl: './requests-logs.component.html',
  styleUrl: './requests-logs.component.scss',
})
export class RequestsLogsComponent implements OnChanges, OnInit {
  protected readonly translate = inject(TranslateService);
  protected readonly router = inject(Router);
  private readonly _accountsClient = inject(AccountsClient);
  private readonly _activitiesClient = inject(ActivitiesClient);
  @Input() projectId: string;
  @Input() searchValue: string;
  @Input() dateFilters: { from: Date; to: Date } = undefined;

  createdByNames = signal<Record<string, string>>({});

  rangeToday = getDateRange('today');

  pageData = signal({
    pageIndex: 0,
    search: '',
    from: this.dateFilters?.from || this.rangeToday.from,
    to: this.dateFilters?.to || this.rangeToday.to,
  });
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

  private activitiesObs$ = toObservable(this.pageData).pipe(
    switchMap((pageData: { pageIndex: number; search: string; from: Date; to: Date }) => {
      return this.getActivities(
        pageData.pageIndex,
        pageData.search,
        pageData.from,
        pageData.to
      );
    })
  );

  activitiesSig: Signal<RequestActivityViewVM[]> = toSignal(
    this.activitiesObs$.pipe(
      tap((res) => {
        this.pageInfo.set(res.pageInfo);
        this.getUsersBulk(res.items);
      }),
      map((value) => {
        return value.items || [];
      })
    ),
    { initialValue: null, rejectErrors: true }
  );

  translation: Record<string, string>;

  async ngOnInit(): Promise<void> {
    this.translation = await firstValueFrom(this.translate.get('Projects.activityLogs'));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.dateFilters?.currentValue) {
      this.pageData.update((data) => ({
        ...data,
        from: this.dateFilters?.from,
        to: this.dateFilters?.to,
      }));
    }
    const searchValue = changes?.searchValue?.currentValue;
    if (searchValue) {
      this.pageData.update((data) => ({
        ...data,
        search: searchValue,
      }));
    }
  }

  goToPageHandler(page: number) {
    this.pageData.update((data) => ({
      ...data,
      pageIndex: page,
    }));
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  private getUsersBulk(requests: RequestActivityViewVM[]) {
    this._accountsClient
      .getBulk(
        '',
        environment.apiVersion,
        requests.map((r) => r.createdBy)
      )
      .subscribe((res) => {
        const mappedUserNames: Record<string, string> = {};
        res.forEach((user) => {
          mappedUserNames[user.id] = user.fullName;
        });
        this.createdByNames.set(mappedUserNames);
      });
  }

  showRequest(activity: RequestActivityViewVM) {
    const routeMap: Record<string, string> = {
      SupplyApprovalRequest: 'supply-requests',
      CovenantRequestStatus: 'convenant-requests',
      PriceApprovalRequest: 'price-requests',
      ExtractRequest: 'extracts',
    };
    if (activity.requestType === 'ExtractRequest') {
      this.router.navigate([
        '/',
        'terms-details',
        activity.termId,
        this.projectId,
        routeMap[activity.requestType],
        activity.request?.requestId,
      ]);
    } else {
      this.router.navigate([
        '/',
        'terms-details',
        activity.termId,
        this.projectId,
        routeMap[activity.requestType],
      ]);
    }
  }
  private getActivities(
    pageIndex: number,
    search: string = undefined,
    from: Date = undefined,
    to: Date = undefined
  ) {
    return this._activitiesClient.getActivities(
      from,
      to,
      this.projectId,
      5,
      pageIndex,
      search,
      false,
      'createdAt',
      environment.apiVersion
    );
  }
}
