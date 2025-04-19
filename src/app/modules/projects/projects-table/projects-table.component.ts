import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  IPageInfo,
  PaginatedListOfProjectListingVm,
  ProjectListingVm,
  ProjectsClient,
  ProjectStatus,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'app-projects-table',
  templateUrl: './projects-table.component.html',
  styleUrls: ['./projects-table.component.scss'],
})
export class ProjectsTableComponent implements OnInit {
  private readonly _projectClient = inject(ProjectsClient);
  protected readonly _translateService = inject(TranslateService);

  projectStatus = ProjectStatus;

  pageIndex = signal(0);
  statusFilter = signal<number | string | null>('');
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
  search = signal('');

  private filterSig = computed(() => {
    const search = this.search();
    const pageIndex = this.pageIndex();
    const statusFilter = this.statusFilter();
    return { search, pageIndex, statusFilter };
  });

  private projectsObs$ = toObservable(this.filterSig).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((filterValue) => {
      return this.getProjectListing(
        filterValue.pageIndex,
        filterValue.search,
        filterValue.statusFilter === 'all' || filterValue.statusFilter === ''
          ? undefined
          : +filterValue.statusFilter
      );
    })
  );

  projectListItems: Signal<ProjectListingVm[]> = toSignal(
    this.projectsObs$.pipe(
      tap((res) => {
        this.pageInfo.set(res.pageInfo);
      }),
      map((value) => value.items)
    ),
    { initialValue: [], rejectErrors: true }
  );

  constructor() {}

  ngOnInit() {}

  private getProjectListing(
    pageindex: number,
    search: string,
    status: number | undefined
  ): Observable<PaginatedListOfProjectListingVm> {
    return this._projectClient.getProjectsListing(
      status,
      undefined,
      pageindex,
      search,
      undefined,
      undefined,
      environment.apiVersion
    );
  }

  get projectStatusesList() {
    return Object.entries(this.projectStatus)
      .map(([label, value]) => ({
        label: this._translateService.instant(`projects.statuses.${label}`),
        value: +value,
      }))
      .slice(Object.keys(this.projectStatus).length / 2);
  }

  get paginationInfoText(): string {
    const currentPage = (this.pageIndex() || 0) + 1;
    const pageSize = 5;
    const total = this.pageInfo().totalCount || 0;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return this._translateService
      .instant('general.table.paginationInfo')
      .replace('{{start}}', start.toString())
      .replace('{{end}}', end.toString())
      .replace('{{total}}', total.toString());
  }

  get hasPrevPage(): boolean {
    return (this.pageIndex() || 0) > 0;
  }

  get hasNextPage(): boolean {
    return (this.pageIndex() || 0) < (this.pageInfo().totalPages || 1) - 1;
  }

  searchChange(ev: Event) {
    const value: string = (ev.target as HTMLInputElement).value;
    this.search.set(value);
  }

  statusFilterChange(ev: Event) {
    const target = ev.target as HTMLSelectElement;
    this.statusFilter.set(target.value === 'all' ? 'all' : +target.value);
  }

  prevPageClickHandler() {
    this.pageIndex.update((ind) => ind - 1);
  }
  nextPageClickHandler() {
    this.pageIndex.update((ind) => ind + 1);
  }
  goToPageHandler(page: number) {
    this.pageIndex.set(page);
  }
}
