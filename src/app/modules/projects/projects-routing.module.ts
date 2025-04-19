import { SettingsComponent } from './../settings/settings.component';
import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';
import { MainDetailsComponent } from './project-details/main-details/main-details.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { TermsTableComponent } from './project-details/terms-table/terms-table.component';
import { ProjectFilesComponent } from './project-details/project-files/project-files.component';
import { TeamComponent } from './project-details/team/team.component';
import { TasksComponent } from './project-details/tasks/tasks.component';
import { PurchaseOrdersComponent } from './project-details/purchase-orders/purchase-orders.component';
import { ProjectsTableComponent } from './projects-table/projects-table.component';
import { ActivityLogsComponent } from './project-details/activity-logs/activity-logs.component';
import { RequestsLogsComponent } from './project-details/activity-logs/requests-logs/requests-logs.component';
import { TasksLogsComponent } from './project-details/activity-logs/tasks-logs/tasks-logs.component';

const projectDetailsRoutes: Route[] = [
  {
    path: '',
    component: MainDetailsComponent,
  },
  {
    path: 'main-details',
    component: MainDetailsComponent,
  },
  {
    path: 'terms-table',
    component: TermsTableComponent,
  },
  {
    path: 'project-files',
    component: ProjectFilesComponent,
  },
  {
    path: 'team',
    component: TeamComponent,
  },
  {
    path: 'tasks',
    component: TasksComponent,
  },
  {
    path: 'tasks/:term',
    component: TasksComponent,
  },
  {
    path: 'purchase-orders',
    component: PurchaseOrdersComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  {
    path: 'activity-logs',
    component: ActivityLogsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'requests-logs',
      },
      {
        path: 'requests-logs',
        component: RequestsLogsComponent,
      },
      {
        path: 'tasks-logs',
        component: TasksLogsComponent,
      },
    ],
  },
];
const routes: Route[] = [
  {
    path: '',
    component: ProjectsTableComponent,
  },
  {
    path: 'project-details/:id',
    component: ProjectDetailsComponent,
    children: projectDetailsRoutes,
  },
  { path: '**', redirectTo: 'horizontal', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
