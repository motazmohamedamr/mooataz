import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IPageInfo } from '@core/api';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { getDateRange } from '@modules/contracts/shared/utils/date-range';
@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
})
export class ActivityLogsComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  debouncedValue = signal('');

  translation: Record<string, string>;
  projectId: string;

  dateFilters: { text: string; value: 'today' | 'last7days' | 'last30days' }[] = [];
  filterValue: 'today' | 'last7days' | 'last30days' = 'today';

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

  async ngOnInit(): Promise<void> {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef) // Automatically unsubscribes when component is destroyed
      )
      .subscribe((value) => {
        this.debouncedValue.set(value);
      });
    this.projectId = this.route.snapshot.params.id;
    this.translation = await firstValueFrom(this.translate.get('Projects.activityLogs'));
    this.dateFilters = [
      {
        text: this.translation?.today,
        value: 'today',
      },
      {
        text: this.translation?.lastWeek,
        value: 'last7days',
      },
      {
        text: this.translation?.lastMonth,
        value: 'last30days',
      },
    ];
  }

  filtersDate: WritableSignal<{ from: Date; to: Date }> = signal(null);

  navigateTo(url: string) {
    this.router.navigate([
      '/',
      'projects',
      'project-details',
      this.projectId,
      'activity-logs',
      url,
    ]);
  }

  setDateFilter(filter: 'today' | 'last7days' | 'last30days') {
    this.filterValue = filter;
    this.filtersDate.set(getDateRange(filter));
  }

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }

  get todaysDate(): string {
    return new Date().toISOString();
  }
}
