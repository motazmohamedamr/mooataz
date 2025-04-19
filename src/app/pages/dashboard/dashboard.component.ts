import { Component, inject, OnInit } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexDataLabels,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexYAxis,
  ApexFill,
  ApexStates,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
} from 'ng-apexcharts';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  DashboardReportsControllersClient,
  DataSummaryView,
  ProjectsClient,
  Role,
} from '@core/api';
import { environment } from '@env/environment';
import { IdentityManager, User } from '@core/auth';
import { LayoutService } from '@metronic/layout';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  states: ApexStates;
  tooltip: ApexTooltip;
  theme: ApexTheme;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _identityManager = inject(IdentityManager);
  private readonly layoutService = inject(LayoutService);
  private readonly _dashboardReportsControllersClient = inject(
    DashboardReportsControllersClient
  );

  translation: any;
  user: User = null;
  asideDisplay: boolean = false;

  projects = toSignal(
    this._projectClient
      .getProjectsListing(
        undefined,
        50,
        0,
        undefined,
        undefined,
        undefined,
        environment.apiVersion
      )
      .pipe(map((x) => x.items))
  );

  dataSummarySig = toSignal(
    this._dashboardReportsControllersClient.getDataSummary(environment.apiVersion),
    {
      rejectErrors: true,
      initialValue: {
        projectsCount: 0,
        totalRequestsCount: 0,
        totalPrice: 0,
      } as DataSummaryView,
    }
  );

  constructor() {}

  async ngOnInit() {
    this.user = this._identityManager.getUser();
    this.asideDisplay = this.layoutService.getProp('aside.display') as boolean;
    this.translation = await firstValueFrom(this.translate.get('general.dashboard'));
  }

  get role(): typeof Role {
    return Role;
  }

  async openModal() {}
}
