import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { DashboardReportsControllersClient, TasksSummaryVM } from '@core/api';
import { finalize, first } from 'rxjs';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { ProjectsService } from '@modules/projects/projects.service';

@Component({
  selector: 'app-tasks-summary-charts',
  templateUrl: './tasks-summary-charts.component.html',
  styleUrl: './tasks-summary-charts.component.scss',
})
export class TasksSummaryChartsComponent implements OnInit, OnChanges {
  @Input() translation: any;
  @Input() asideDisplay: boolean;

  protected readonly translate = inject(TranslateService);
  protected readonly _projectsService = inject(ProjectsService);

  loading = signal(true);
  statsKeysValues: { key: keyof TasksSummaryVM; title: string; chart?: boolean }[] = [];

  chartOptions: any = {};

  iconColors: Record<number, { svgIconFill: string; paddingColor: string }> = {
    2: { svgIconFill: '#F64E60', paddingColor: '#F64E601F' },
    0: { svgIconFill: '#00AB9A', paddingColor: '#00AB9A1F' },
    1: { svgIconFill: '#3699FF', paddingColor: '#3699FF1F' },
  };

  private readonly _dashboardReportsControllersClient = inject(
    DashboardReportsControllersClient
  );

  tasksSummary = signal([]);

  ngOnInit(): void {
    this._dashboardReportsControllersClient
      .getTasksSummary(environment.apiVersion)
      .pipe(
        first(),
        finalize(() => this.loading.set(false))
      )
      .subscribe(async (response) => {
        let items: TasksSummaryVM[] = [];
        for await (const item of response) {
          item.siteImage = item.siteImage
            ? await this._projectsService.download(item.siteImage)
            : '';
          items.push(item);
        }
        this.tasksSummary.set(items);
        this.loading.set(false);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        { key: 'completedTasksCount', title: this.translation?.finished },
        { key: 'inProgressTasksCount', title: this.translation?.inProgress },
        { key: 'notStartedTaskCount', title: this.translation?.notStarted },
      ];
      this.chartOptions = {
        chart: {
          type: 'donut',
          fontFamily: 'inherit',
          height: 230,
          width: 230,
        },
        dataLabels: {
          enabled: false,
        },
        plotOptions: {
          pie: {
            donut: {
              size: '80%',
            },
          },
        },
        colors: ['#F64E60', '#3699FF', '#0BB783'],
        stroke: {
          width: 1,
        },
        fill: {
          type: 'gradient',
        },
        legend: {
          show: false,
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: 'bottom',
              },
            },
          },
        ],
      };
    }
  }
}
