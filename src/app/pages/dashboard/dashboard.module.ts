import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { ModalsModule } from '../../_metronic/partials';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectItemCardComponent } from './project-item-card/project-item-card.component';
import { SharedModule } from '../../core/shared/shared.module';
import { DashboardStatsCardComponent } from './dashboard-stats-card/dashboard-stats-card.component';
import { FinancialPositionSummaryChartsComponent } from './financial-position-summary-charts/financial-position-summary-charts.component';
import { RequestsSummaryChartsComponent } from './requests-summary-charts/requests-summary-charts.component';
import { TasksSummaryChartsComponent } from './tasks-summary-charts/tasks-summary-charts.component';
import { TimelineProjectsSummaryChartComponent } from './timeline-projects-summary-chart/timeline-projects-summary-chart.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ProjectItemCardComponent,
    DashboardStatsCardComponent,
    FinancialPositionSummaryChartsComponent,
    RequestsSummaryChartsComponent,
    TasksSummaryChartsComponent,
    TimelineProjectsSummaryChartComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardComponent,
      },
    ]),
    ModalsModule,
    NgApexchartsModule,
    TranslateModule,
    SharedModule,
  ],
})
export class DashboardModule {}
