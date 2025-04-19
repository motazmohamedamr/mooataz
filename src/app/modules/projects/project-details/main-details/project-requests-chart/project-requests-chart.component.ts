import {
  Component,
  inject,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ProjectsClient, RequestsSummaryVM } from '@core/api';
import { environment } from '@env/environment';
import { first } from 'rxjs';

@Component({
  selector: 'app-project-requests-chart',
  templateUrl: './project-requests-chart.component.html',
  styleUrl: './project-requests-chart.component.scss',
})
export class ProjectRequestsChartComponent implements OnChanges {
  private readonly _projectClient = inject(ProjectsClient);

  @Input() translation: any;
  @Input({ required: true }) projectId: string;
  statsKeysValues: { key: keyof RequestsSummaryVM; title: string; chart?: boolean }[] =
    [];

  chartOptions: any = {};

  iconColors: Record<number, { svgIconFill: string; paddingColor: string }> = {
    0: { svgIconFill: '#3699FF', paddingColor: '#3699FF1F' },
    1: { svgIconFill: '#F64E60', paddingColor: '#F64E601F' },
    2: { svgIconFill: '#0BB783', paddingColor: '#00AB9A1F' },
    3: { svgIconFill: '#B5B5C3', paddingColor: '#A1A5B71F' },
  };

  requestsSummary = signal<RequestsSummaryVM[] | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        { key: 'priceRequestsCount', title: this.translation?.priceRequests },
        { key: 'covenantRequestsCount', title: this.translation?.convenantRequests },
        { key: 'supplyRequestsCount', title: this.translation?.supplyRequests },
        { key: 'extractRequestsCount', title: this.translation?.extracts },
      ];
      this._projectClient
        .getRequestsSummary(this.projectId, environment.apiVersion)
        .pipe(first())
        .subscribe((summary) => {
          this.requestsSummary.set(summary);
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
            colors: ['#3699FF', '#F64E60', '#0BB783', '#B5B5C3'],
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
    if (!this.requestsSummary() || !this.requestsSummary().length) return [];
    return [
      this.requestsSummary()[0].priceRequestsCount,
      this.requestsSummary()[0].covenantRequestsCount,
      this.requestsSummary()[0].supplyRequestsCount,
      this.requestsSummary()[0].extractRequestsCount,
    ];
  }

  get chartLabels(): string[] {
    if (!this.requestsSummary() || !this.requestsSummary().length) return [];
    return [
      this.translation?.priceRequests,
      this.translation?.convenantRequests,
      this.translation?.supplyRequests,
      this.translation?.extracts,
    ];
  }

  get totalNumberOfRequests(): number {
    if (!this.requestsSummary() || !this.requestsSummary().length) return 0;
    return (
      this.requestsSummary()[0].priceRequestsCount +
      this.requestsSummary()[0].covenantRequestsCount +
      this.requestsSummary()[0].supplyRequestsCount +
      this.requestsSummary()[0].extractRequestsCount
    );
  }
}

