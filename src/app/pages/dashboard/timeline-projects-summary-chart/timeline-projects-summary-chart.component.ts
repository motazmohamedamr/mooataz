import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { DashboardReportsControllersClient, TimelineSummaryVM } from '@core/api';
import { finalize, first } from 'rxjs';
import { environment } from '@env/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectsService } from '@modules/projects/projects.service';

@Component({
  selector: 'app-timeline-projects-summary-chart',
  templateUrl: './timeline-projects-summary-chart.component.html',
  styleUrl: './timeline-projects-summary-chart.component.scss',
})
export class TimelineProjectsSummaryChartComponent implements OnInit, OnChanges {
  @Input() asideDisplay: boolean;
  @Input() translation: any;

  loading = signal(true);
  statsKeysValues: { key: keyof TimelineSummaryVM; title: string; chart?: boolean }[] =
    [];

  chartOptions: any = {};

  iconColors: Record<number, { svgIconFill: string; paddingColor: string }> = {
    1: { svgIconFill: '#00AB9A', paddingColor: '#00AB9A1F' },
    2: { svgIconFill: '#3699FF', paddingColor: '#3699FF1F' },
    0: { svgIconFill: '#F64E60', paddingColor: '#F64E601F' },
  };

  private readonly _dashboardReportsControllersClient = inject(
    DashboardReportsControllersClient
  );
  private readonly _projectsService = inject(ProjectsService);

  timelineProjectSummary = signal<TimelineSummaryVM[]>([]);

  ngOnInit(): void {
    this._dashboardReportsControllersClient
      .getTimelineProjectsSummary(environment.apiVersion)
      .pipe(
        first(),
        finalize(() => this.loading.set(false))
      )
      .subscribe(async (response) => {
        let items: TimelineSummaryVM[] = [];
        for await (const item of response) {
          item.siteImage = item.siteImage
            ? await this._projectsService.download(item.siteImage)
            : '';
          items.push(item);
        }
        this.timelineProjectSummary.set(items);
        this.loading.set(false);
      });

    this.chartOptions = {
      chart: {
        fontFamily: 'inherit',
        // height: 80,
        type: 'radialBar',
        offsetY: -4,
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 0,
            size: '70%',
          },
          dataLabels: {
            show: false,
            name: {
              show: false,
            },
          },
          track: {
            background: '#15845630',
            strokeWidth: '100%',
          },
        },
      },
      colors: ['#158456'],
      stroke: {
        lineCap: 'round',
      },
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        {
          key: 'totalDurationMonths',
          title: this.translation?.projectPeriod,
          chart: true,
        },
        { key: 'remainingDurationInMonths', title: this.translation?.remainingPeriod },
        { key: 'elapsedDurationMonths', title: this.translation?.elaspedDuration },
      ];
    }
  }
}
