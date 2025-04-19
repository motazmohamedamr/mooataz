import {
  Component,
  inject,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ProjectsClient, ProjectTasksSummaryVM } from '@core/api';
import { environment } from '@env/environment';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-project-tasks-chart',
  templateUrl: './project-tasks-chart.component.html',
  styleUrl: './project-tasks-chart.component.scss',
})
export class ProjectTasksChartComponent implements OnChanges {
  private readonly _projectClient = inject(ProjectsClient);

  @Input() translation: any;
  @Input({ required: true }) projectId: string;
  statsKeysValues: {
    key: keyof ProjectTasksSummaryVM;
    title: string;
    chart?: boolean;
  }[] = [];

  chartOptions: any = {};

  iconColors: Record<number, { svgIconFill: string; paddingColor: string }> = {
    0: { svgIconFill: '#3699FF', paddingColor: '#3699FF1F' },
    1: { svgIconFill: '#0BB783', paddingColor: '#00AB9A1F' },
    2: { svgIconFill: '#B5B5C3', paddingColor: '#A1A5B71F' },
    3: { svgIconFill: '#F64E60', paddingColor: '#F64E601F' },
  };

  tasksSummary = signal<ProjectTasksSummaryVM | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        { key: 'inProgressTasksCount', title: this.translation?.inProgress },
        { key: 'completedTasksCount', title: this.translation?.completed },
        { key: 'notStartedTaskCount', title: this.translation?.notStarted },
      ];
      this._projectClient
        .getProjectTaskSummary(this.projectId, environment.apiVersion)
        .pipe(first())
        .subscribe((summary) => {
          this.tasksSummary.set(summary);
          this.chartOptions = {
            series: this.chartSeries,
            labels: this.chartLabels,
            chart: {
              type: 'donut',
              fontFamily: 'inherit',
              width: '185px',
              height: '185px',
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
            colors: ['#3699FF', '#0BB783', '#B5B5C3', '#F64E60'],
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
        });
    }
  }

  get chartSeries(): number[] {
    if (!this.tasksSummary()) return [];
    return [
      this.tasksSummary().inProgressTasksCount,
      this.tasksSummary().completedTasksCount,
      this.tasksSummary().notStartedTaskCount,
    ];
  }

  get chartLabels(): string[] {
    if (!this.tasksSummary()) return [];
    return [
      this.translation?.inProgress,
      this.translation?.completed,
      this.translation?.notStarted,
    ];
  }

  get totalNumberOfTasks(): number {
    if (!this.tasksSummary()) return 0;
    return (
      this.tasksSummary().inProgressTasksCount +
      this.tasksSummary().completedTasksCount +
      this.tasksSummary().notStartedTaskCount
    );
  }

  get totalTasks() {
    return this.translation?.totalTasks?.replace('{{total}}', this.totalNumberOfTasks);
  }
}

