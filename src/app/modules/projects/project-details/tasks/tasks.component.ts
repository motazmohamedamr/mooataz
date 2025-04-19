import {
  Component,
  inject,
  OnInit,
  WritableSignal,
  signal,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IPageInfo,
  ProjectQuantityAutoCompleteVm,
  ProjectsClient,
  WorkItemListingVm,
  WorkItemStatus,
  WorkItemVm,
  WorkItemsClient,
} from '@core/api';
import { environment } from '@env/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragulaService } from 'ng2-dragula';
import { AddTaskComponent } from './add-task/add-task.component';
import { ProjectsService } from '@modules/projects/projects.service';
import {
  OperatorFunction,
  Observable,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  map,
  Subscription,
  Subject,
} from 'rxjs';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent implements OnInit, AfterViewInit, OnDestroy {
  tasks: WorkItemListingVm;
  notStartedTasks: WorkItemVm[] = [];
  inProgressTasks: WorkItemVm[] = [];
  completedTasks: WorkItemVm[] = [];
  notStartedTasksCount: number = 0;
  inProgressTasksCount: number = 0;
  completedTasksCount: number = 0;
  allTasks: WorkItemVm[] = [];
  usersList: any[] = [];
  projectId: string;
  termId: any;
  search: any;
  WorkItemStatus = WorkItemStatus;

  workItemsPagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
  });

  notStartingTasksPagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });
  inProgressTasksPagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });
  completedTasksPagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });
  termsList: ProjectQuantityAutoCompleteVm[] = [];
  termModel: string;
  termFormatter = (term: any) => term.title;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  // private router = inject(Router);
  private readonly _workItemsClient = inject(WorkItemsClient);
  private readonly dragulaService = inject(DragulaService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private modalService = inject(NgbModal);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _projectsService = inject(ProjectsService);

  private dropSubscription: Subscription | null = null;
  private scrollSubject = new Subject<void>();
  private scrollSubscription: Subscription;
  loading = false;

  private originalPosition: {
    source: HTMLElement;
    index: number;
    element: HTMLElement;
  } | null = null;

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.scrollSubject.next();
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params.id;
    this.termId = this.route.snapshot.queryParams['term'];
    this.search = this.route.snapshot.queryParams['search'];
    this.scrollSubscription = this.scrollSubject
      .pipe(
        debounceTime(500) // Wait 300ms after the last scroll event
      )
      .subscribe(() => {
        // Check if the user has scrolled to the bottom of the page
        if (this.isBottomOfPage && !this.isLastPage && !this.loading) {
          this.workItemsPagingOptions.set({
            ...this.workItemsPagingOptions(),
            pageIndex: this.workItemsPagingOptions().pageIndex + 1,
          });
          this.getTasks(true);
        }
      });
    this.getUsersList();
  }

  ngAfterViewInit() {
    this.getTasks(this.search || '');
    this.dropSubscription = this.dragulaService
      .drop('DRAGULA_FACTS')
      .subscribe(({ el, source, target }: any) => {
        this.originalPosition = {
          source,
          index: Array.from(source.children).indexOf(el),
          element: el,
        };
        var request: any = {
          oldValue: +source.id,
          newValue: +target.id,
        };
        if (+source.id == 0) this.notStartedTasksCount = this.notStartedTasksCount - 1;
        if (+source.id == 1) this.inProgressTasksCount = this.inProgressTasksCount - 1;
        if (+source.id == 2) this.completedTasksCount = this.completedTasksCount - 1;
        if (+target.id == 0) this.notStartedTasksCount = this.notStartedTasksCount + 1;
        if (+target.id == 1) this.inProgressTasksCount = this.inProgressTasksCount + 1;
        if (+target.id == 2) this.completedTasksCount = this.completedTasksCount + 1;

        this._workItemsClient.move(el.id, environment.apiVersion, request).subscribe(
          () => this.changeDetectorRef.detectChanges(),
          () => this.revertToOriginalPosition()
        );
      });
  }
  private revertToOriginalPosition() {
    if (this.originalPosition) {
      const { source, index, element } = this.originalPosition;
      // Reinsert the element at its original position
      source.insertBefore(element, source.children[index] || null);
    }
  }
  getTerms(ids: string[]) {
    if (!ids || !ids.length) return;
    this._projectClient
      .getProjectQuantitiesBulk('1', this.projectId, ids)
      .subscribe((data) => {
        this.termsList = data;
        this.termModel = this.termsList.filter((x) => x.id == this.termId)[0]?.title;
        this.changeDetectorRef.detectChanges();
      });
  }
  getTermObj(id: string) {
    return this.termsList.find((x) => x.id == id);
  }

  getUsersList() {
    this._projectsService.projectUsers$.subscribe((res) => {
      const arr = [];
      for (let a of Object.values(res)) {
        arr.push(...a);
      }
      this.usersList = arr;
    });
  }

  getUser(id: string) {
    let user;
    if (this.usersList) {
      user = this.usersList?.find((a) => a.id == id);
    }
    // this.changeDetectorRef.detectChanges();
    return user;
  }

  getTasks(addOnSroll: boolean = false, search?: string) {
    this.loading = true;
    this._workItemsClient
      .getListing(
        this.projectId,
        this.termId,
        5,
        this.workItemsPagingOptions().pageIndex,
        search,
        this.workItemsPagingOptions().ascending,
        this.workItemsPagingOptions().sortingBy,
        environment.apiVersion
      )
      .subscribe(
        (x) => {
          this.tasks = x;
          this.notStartedTasks = addOnSroll
            ? [...this.notStartedTasks, ...this.tasks.notStarted.items]
            : this.tasks.notStarted.items;
          this.inProgressTasks = addOnSroll
            ? [...this.inProgressTasks, ...this.tasks.inProgress.items]
            : this.tasks.inProgress.items;
          this.completedTasks = addOnSroll
            ? [...this.completedTasks, ...this.tasks.completed.items]
            : this.tasks.completed.items;

          this.notStartingTasksPagingOptions.set(x.notStarted?.pageInfo);
          this.inProgressTasksPagingOptions.set(x.inProgress?.pageInfo);
          this.completedTasksPagingOptions.set(x.completed?.pageInfo);

          this.notStartedTasksCount = this.notStartedTasks.length;
          this.inProgressTasksCount = this.inProgressTasks.length;
          this.completedTasksCount = this.completedTasks.length;
          let arr: WorkItemVm[] = [];
          Object.values(this.tasks).forEach((x) => {
            arr.push(...x.items);
            this.allTasks = [...this.allTasks, ...arr];
          });
          const Ids: string[] = this.allTasks?.map((x: WorkItemVm) => x.termId);
          this.getTerms(Ids);
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        },
        (err) => (this.loading = false)
      );
  }

  searchInTasks(e: any) {
    const x: string = e.target.value;
    if (x.length >= 2) this.getTasks(false, x);
    if (x.length === 0) this.getTasks();
  }

  termsSearch: OperatorFunction<string, readonly ProjectQuantityAutoCompleteVm[]> = (
    text$: Observable<string>
  ) => {
    const debouncedText$ = text$.pipe(debounceTime(500), distinctUntilChanged());

    return debouncedText$.pipe(
      switchMap((term) => {
        if (term.length < 1) return of([]);
        return this._projectClient
          .autoCompleteProjectQuantity(this.projectId, term, environment.apiVersion)
          .pipe(
            map((result) => {
              this.termsList = result;
              return this.termsList?.filter((t) => true);
            })
          );
      })
    );
  };
  selectTerm(e: any) {
    this.termId = e.item.id;
    this.router.navigate([], {
      queryParams: {
        term: this.termId,
      },
      queryParamsHandling: 'merge',
    });
    this.getTasks();
  }
  clearTermsSearch() {
    if (this.termId) {
      this.termId = null;
      this.router.navigate([], {
        queryParams: {
          term: null,
        },
        queryParamsHandling: 'merge',
      });
      this.getTasks();
    }
  }

  setRemainingTimeTooltip(task: WorkItemVm) {
    return (
      task.remainingTime.remainingPeriod.days +
      'd - ' +
      task.remainingTime.remainingPeriod.months +
      'm - ' +
      task.remainingTime.remainingPeriod.years +
      'y'
    );
  }
  refresh() {
    // this.getTasks();
    this.changeDetectorRef.detectChanges();
  }
  createUpdateTaskModal(task?: WorkItemVm) {
    const modalRef = this.modalService.open(AddTaskComponent, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.task = task;
    modalRef.componentInstance.usersList = this.usersList;
    modalRef.componentInstance.term = this.getTermObj(task?.termId);
    modalRef.result.then(
      (data) => {
        // on close
        if (data) this.getTasks();
      },
      (reason) => {
        // on dismiss
      }
    );
  }

  private get isBottomOfPage(): boolean {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const threshold = 100; // Adjust this value to trigger the load earlier or later

    return windowHeight + scrollTop + threshold >= documentHeight;
  }

  private get isLastPage(): boolean {
    return (
      this.inProgressTasksPagingOptions().pageIndex >=
        this.inProgressTasksPagingOptions().totalPages - 1 &&
      this.notStartingTasksPagingOptions().pageIndex >=
        this.notStartingTasksPagingOptions().totalPages - 1 &&
      this.completedTasksPagingOptions().pageIndex >=
        this.completedTasksPagingOptions().totalPages - 1
    );
  }

  ngOnDestroy(): void {
    if (this.dropSubscription) {
      this.dropSubscription.unsubscribe();
    }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }
}
