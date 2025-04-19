import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsComponent } from './projects.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectsTableComponent } from './projects-table/projects-table.component';
import { MainDetailsComponent } from './project-details/main-details/main-details.component';
import { ProjectsRoutingModule } from './projects-routing.module';
import { TermsTableComponent } from './project-details/terms-table/terms-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectFilesComponent } from './project-details/project-files/project-files.component';
import { TeamComponent } from './project-details/team/team.component';
import { TasksComponent } from './project-details/tasks/tasks.component';
import { PurchaseOrdersComponent } from './project-details/purchase-orders/purchase-orders.component';
import { SettingsComponent } from './project-details/settings/settings.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectListItemComponent } from './projects-table/project-list-item/project-list-item.component';
import { ProjectListHeaderComponent } from './projects-table/project-list-header/project-list-header.component';
import { DragulaModule } from 'ng2-dragula';
import { AddTaskComponent } from './project-details/tasks/add-task/add-task.component';
import {
  NgbDatepickerModule,
  NgbDropdown,
  NgbTypeaheadModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TagifyModule } from 'ngx-tagify';
import { TeamUserComponent } from './project-details/team/team-list/team-user/team-user.component';
import { DepartmentsComponent } from './project-details/team/departments/departments.component';
import { TeamListComponent } from './project-details/team/team-list/team-list.component';
import { DepartmentComponent } from './project-details/team/departments/department/department.component';
import { AssignUserDialogComponent } from './project-details/team/assign-user-dialog/assign-user-dialog.component';
import { SharedModule } from '@core/shared/shared.module';
import { ProjectFileDragDirective } from './project-details/project-files/directives/drag.directive';
import { ListTableComponent } from './project-details/terms-table/list-table/list-table.component';
import { CardsTableComponent } from './project-details/terms-table/cards-table/cards-table.component';
import { MatMenuModule } from '@angular/material/menu';
import { TotalProjectValueChartComponent } from './project-details/main-details/total-project-value-chart/total-project-value-chart.component';
import { SmallExpensesChartComponent } from './project-details/main-details/small-expenses-chart/small-expenses-chart.component';
import { LargeExpensesChartComponent } from './project-details/main-details/large-expenses-chart/large-expenses-chart.component';
import { ProjectDurationComponent } from './project-details/main-details/project-duration/project-duration.component';
import { LastRequestsComponent } from './project-details/main-details/last-requests/last-requests.component';
import { ProjectRequestsChartComponent } from './project-details/main-details/project-requests-chart/project-requests-chart.component';
import { ProjectTasksChartComponent } from './project-details/main-details/project-tasks-chart/project-tasks-chart.component';
import { ProjectTeamsComponent } from './project-details/main-details/project-teams/project-teams.component';
import { ProjectTasksComponent } from './project-details/main-details/project-tasks/project-tasks.component';
import { ActivityLogsComponent } from './project-details/activity-logs/activity-logs.component';
import { RequestsLogsComponent } from './project-details/activity-logs/requests-logs/requests-logs.component';
import { TasksLogsComponent } from './project-details/activity-logs/tasks-logs/tasks-logs.component';

@NgModule({
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    TranslateModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    NgbTypeaheadModule,
    MatMenuModule,
    NgbDatepickerModule,
    TagifyModule,
    NgbDropdown,
    DragulaModule.forRoot(),
  ],
  declarations: [
    ProjectsComponent,
    ProjectDetailsComponent,
    ProjectsTableComponent,
    MainDetailsComponent,
    TermsTableComponent,
    ProjectFilesComponent,
    TeamComponent,
    TasksComponent,
    ProjectFileDragDirective,
    PurchaseOrdersComponent,
    SettingsComponent,
    ProjectListItemComponent,
    ProjectListHeaderComponent,
    AddTaskComponent,
    TeamUserComponent,
    DepartmentsComponent,
    TeamListComponent,
    DepartmentComponent,
    AssignUserDialogComponent,
    ListTableComponent,
    CardsTableComponent,
    TotalProjectValueChartComponent,
    SmallExpensesChartComponent,
    LargeExpensesChartComponent,
    ProjectDurationComponent,
    LastRequestsComponent,
    ProjectRequestsChartComponent,
    ProjectTasksChartComponent,
    ProjectTeamsComponent,
    ProjectTasksComponent,
    ActivityLogsComponent,
    RequestsLogsComponent,
    TasksLogsComponent,
  ],
})
export class ProjectsModule {}
