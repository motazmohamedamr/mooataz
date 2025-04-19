import { Component, inject, OnInit, Signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IProjectsStatusVm, ProjectsClient, ProjectsStatusVm } from '@core/api';
import { environment } from '@env/environment';
import { ChartOptions } from '@modules/projects/project-details/main-details/main-details.component';
import { TranslateService } from '@ngx-translate/core';
import { ChartComponent } from 'ng-apexcharts';
import { tap } from 'rxjs';

@Component({
  selector: 'app-project-list-header',
  templateUrl: './project-list-header.component.html',
  styleUrl: './project-list-header.component.scss',
})
export class ProjectListHeaderComponent implements OnInit {
  public chartOptions: Partial<ChartOptions>;
  @ViewChild('chart') chart: ChartComponent;

  private readonly _projectClient = inject(ProjectsClient);
  private readonly _translateService = inject(TranslateService);

  projectStatusDetails: Signal<IProjectsStatusVm> = toSignal(
    this._projectClient
      .getProjectsStatus(environment.apiVersion)
      .pipe(tap((projectstatus) => this.initChart(projectstatus))),
    {
      initialValue: new ProjectsStatusVm({
        totalCount: 0,
        hasContract: 0,
        noContract: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
      }),
      rejectErrors: true,
    }
  );

  constructor() {}
  ngOnInit(): void {}

  initChart(status: ProjectsStatusVm) {
    this.chartOptions = {
      series: [status.inProgress, status.completed, status.notStarted],
      chart: {
        type: 'donut',
      },
      colors: ['#5C6BC0', '#FF9800', '#03A9F4'],
      labels: [
        this._translateService.instant('projects.statuses.InProgress'),
        this._translateService.instant('projects.statuses.Completed'),
        this._translateService.instant('projects.statuses.NotStarted'),
      ],
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
