import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ActivitiesClient,
  IPageInfo,
  IPaginatedListOfRequestActivityViewVM,
  PaginatedListOfRequestActivityViewVM,
  RequestActivityViewVM,
} from '@core/api';
import { IAioTableColumn } from '@core/shared/components/aio-table/columns/aio-table-column.interface';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { AioTableSortDirection } from '@core/shared/components/aio-table/types';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-last-requests',
  templateUrl: './last-requests.component.html',
  styleUrl: './last-requests.component.scss',
})
export class LastRequestsComponent implements OnInit, OnChanges {
  @Output() goToActivityTabEv = new EventEmitter<void>();
  @Input() projectId: string;
  @Input() translation: any;

  private readonly translate = inject(TranslateService);
  private readonly _activitiesClient = inject(ActivitiesClient);
  private readonly router = inject(Router);

  requestActivityStatuses: Record<string, BadgeItem>;
  requestTypes: Record<string, string>;

  activities = signal<PaginatedListOfRequestActivityViewVM>({
    pageInfo: null,
    items: [],
  } as PaginatedListOfRequestActivityViewVM);
  totalActivitiesCount = computed(() => this.activities()?.pageInfo?.totalCount || 0);

  tableColums: IAioTableColumn<IPaginatedListOfRequestActivityViewVM>[] = [];

  pageIndexSig = signal(0);
  pageInfo: WritableSignal<IPageInfo> = signal({
    sortingBy: 'createdAt',
    ascending: false,
    pageIndex: 0,
    totalPages: 0,
    totalCount: 0,
  });
  paginationPages = computed(() => {
    return Array.from({ length: this.pageInfo().totalPages }, (_, i) => i + 1);
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      const translation = changes?.translation?.currentValue;
      this.tableColums = [
        {
          title: this.translation?.requestNumber,
          sortable: true,
          sortBy: 'request.requestNumber',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.requestType,
          sortable: true,
          sortBy: 'requestType',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.requestDate,
          sortable: true,
          sortBy: 'createdAt',
          render(data) {
            return '';
          },
        },
        {
          title: this.translation?.requestStatus,
          sortable: true,
          sortBy: 'request.status',
          render(data) {
            return '';
          },
        },
      ];
      this.requestActivityStatuses = {
        Approved: new BadgeItem(
          translation.activityStatuses.Approved,
          'badge-light-success'
        ),
        Draft: new BadgeItem(translation.activityStatuses.Draft, 'badge-dark'),
        Rejected: new BadgeItem(
          translation.activityStatuses.Rejected,
          'badge-light-danger'
        ),
        Completed: new BadgeItem(
          translation.activityStatuses.Completed,
          'badge-light-success'
        ),
        Created: new BadgeItem(translation.activityStatuses.Created, 'badge-light-info'),
        Transferred: new BadgeItem(
          translation.activityStatuses.Transferred,
          'badge-light-success'
        ),
        TransferredPartial: new BadgeItem(
          translation.activityStatuses.TransferredPartial,
          'badge-light-success'
        ),
      };
      this.requestTypes = {
        PriceApprovalRequest: translation.requestTypes.PriceRequest,
        PriceApprovalRequestStatus: translation.requestTypes.PriceRequest,
        CovenantRequest: translation.requestTypes.CovenantRequest,
        CovenantRequestStatus: translation.requestTypes.CovenantRequest,
        ExtractRequest: translation.requestTypes.ExtractRequest,
        ExtractRequestStatus: translation.requestTypes.ExtractRequest,
        SupplyApprovalRequest: translation.requestTypes.SupplyRequest,
        SupplyApprovalRequestStatus: translation.requestTypes.SupplyRequest,
      };
    }
  }

  async ngOnInit(): Promise<void> {
    const activities = await firstValueFrom(this.getActivities());
    this.activities.set(activities);
  }

  goToActivityTab() {
    this.goToActivityTabEv.emit();
  }

  async sort(column: IAioTableColumn<any>): Promise<void> {
    if (!column.sortable || !column.sortBy) {
      return;
    }

    // asc -> desc -> null
    let direction = AioTableSortDirection.None;

    if (this.pageInfo().sortingBy === column.sortBy) {
      if (this.pageInfo().ascending) {
        direction = AioTableSortDirection.Desc;
      }
    } else {
      direction = AioTableSortDirection.Asc;
    }

    this.activities.set(
      await firstValueFrom(
        this.getActivities(
          this.pageInfo().pageIndex,
          direction === AioTableSortDirection.Asc,
          column.sortBy
        )
      )
    );
  }

  getActivities(
    pageIndex: number = 0,
    ascending = false,
    sortedBy = 'createdAt'
  ): Observable<PaginatedListOfRequestActivityViewVM> {
    return this._activitiesClient
      .getProjectActivities(
        undefined,
        undefined,
        this.projectId,
        5,
        pageIndex,
        undefined,
        ascending,
        sortedBy,
        environment.apiVersion
      )
      .pipe(
        tap((res) => {
          this.pageInfo.set(res.pageInfo);
        })
      );
  }

  goToActivityDetails(activity: RequestActivityViewVM) {
    const routeMap: Record<string, string> = {
      SupplyRequest: 'supply-requests',
      CovenantRequest: 'convenant-requests',
      PriceRequest: 'price-requests',
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

  get totalRequests() {
    return this.translation?.totalRequests?.replace(
      '{{total}}',
      this.totalActivitiesCount
    );
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  async goToPageHandler(page: number) {
    const activities = await firstValueFrom(
      this.getActivities(page, this.pageInfo().ascending, this.pageInfo().sortingBy)
    );
    this.activities.set(activities);
  }
}

