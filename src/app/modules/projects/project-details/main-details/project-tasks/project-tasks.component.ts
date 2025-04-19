import {
  Component,
  computed,
  DestroyRef,
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AccountListVm,
  BusinessType,
  IPageInfo,
  WorkItemListingSummaryVm,
  WorkItemsClient,
  WorkItemStatus,
} from '@core/api';
import { BadgeItem } from '@core/shared/components/aio-table/columns/badge.column';
import { environment } from '@env/environment';
import { ProjectsService } from '@modules/projects/projects.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-project-tasks',
  templateUrl: './project-tasks.component.html',
  styleUrl: './project-tasks.component.scss',
})
export class ProjectTasksComponent implements OnInit, OnChanges {
  @Output() goToTasksEv: EventEmitter<void> = new EventEmitter<void>();
  private readonly _workItemsClient = inject(WorkItemsClient);
  private readonly _projectsService = inject(ProjectsService);
  @Input() translation: any;
  @Input({ required: true }) projectId: string;

  businessTypes: Record<string, string> = null;

  workItems = signal([]);
  workItemsCount = signal(0);

  destroyRef = inject(DestroyRef);

  workItemsStatuses: Record<string, BadgeItem>;

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

  get totalTasks() {
    return this.translation?.totalTasks?.replace('{{total}}', this.workItemsCount());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      const translation = changes?.translation?.currentValue;
      this.businessTypes = {
        [BusinessType.Architectural.toString()]: translation.businessTypes.Architectural,
        [BusinessType.Electrical.toString()]: translation.businessTypes.Electrical,
        [BusinessType.Mechanical.toString()]: translation.businessTypes.Mechanical,
        [BusinessType.Other.toString()]: translation.businessTypes.Other,
        [BusinessType.Structural.toString()]: translation.businessTypes.Structural,
        [BusinessType.Telecommunications.toString()]:
          translation.businessTypes.Telecommunications,
      };

      this.workItemsStatuses = {
        [WorkItemStatus.Archived]: new BadgeItem(
          this.translation.workItemsStatuses.Archived,
          'badge-dark'
        ),
        [WorkItemStatus.InProgress]: new BadgeItem(
          this.translation.workItemsStatuses.InProgress,
          'badge-light-warning'
        ),
        [WorkItemStatus.Created]: new BadgeItem(
          this.translation.workItemsStatuses.Created,
          'badge-light-info'
        ),
        [WorkItemStatus.Completed]: new BadgeItem(
          this.translation.workItemsStatuses.Completed,
          'badge-light-success'
        ),
      };
    }
  }

  async ngOnInit(): Promise<void> {
    await this.getWorkItems(0);
  }

  async getWorkItems(pageIndex: number) {
    const workitems = await firstValueFrom(
      this._workItemsClient.getListing2(
        this.projectId,
        5,
        pageIndex,
        undefined,
        undefined,
        undefined,
        environment.apiVersion
      )
    );
    this.pageInfo.set(workitems.pageInfo);
    this.workItemsCount.set(workitems?.pageInfo?.totalCount || 0);
    this._projectsService.projectUsers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (users) => {
        const allUsers: AccountListVm[] = [];

        for (let user of Object.values(users)) {
          allUsers.push(...user);
        }
        this.workItems.set(
          workitems?.items.map(
            (item) =>
              ({
                ...item,
                assignees:
                  allUsers.length > 0
                    ? (item.assignees.map((assignee) =>
                        allUsers.find((user) => user.id === assignee)
                      ) as any)
                    : [],
              } as WorkItemListingSummaryVm)
          )
        );
      });
  }

  goToTasks() {
    this.goToTasksEv.emit();
  }

  async goToPageHandler(page: number) {
    await this.getWorkItems(page);
  }
}
