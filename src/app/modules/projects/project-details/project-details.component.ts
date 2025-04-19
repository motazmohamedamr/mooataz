import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IProjectQuantityVm,
  ProjectDetailsVm,
  ProjectsClient,
  ProjectStatus,
  Role,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { ProjectsService } from '../projects.service';
import { first, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: ProjectDetailsVm;
  ProjectStatus = ProjectStatus;
  implementationPeriod: number;
  activeTab: number = 0;

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  protected readonly _translateService = inject(TranslateService);
  protected readonly _projectService = inject(ProjectsService);
  protected readonly Role = Role;

  projectId: string = '';
  projectImageUrl: string = '';

  constructor() {}

  ngOnInit() {
    this.projectId = this.route.snapshot.params.id;
    this.subRoutes();
    this.getProjectDetails();

    this._projectService.getUsers(this.projectId, undefined).pipe(first()).subscribe();
  }

  protected async getProjectDetails() {
    const project = await firstValueFrom(
      this._projectClient.getProjectDetails(this.projectId, environment.apiVersion)
    );

    this.project = project;
    if (this.project.siteImage) {
      this.projectImageUrl = await this._projectService.download(this.project.siteImage);
    } else {
      this.projectImageUrl = '';
    }
    this.changeDetectorRef.detectChanges();
  }

  subRoutes() {
    var paths = this.router.url.split('/');
    const path = paths[paths.length - 1];
    const _path = path.split('?')[0];
    switch (_path) {
      case 'terms-table':
        this.activeTab = 1;
        break;
      case 'tasks':
        this.activeTab = 2;
        break;
      case 'team':
        this.activeTab = 3;
        break;
      case 'project-files':
        this.activeTab = 4;
        break;
      case 'activity-logs':
      case 'requests-logs':
      case 'tasks-logs':
        this.activeTab = 5;
        break;
      case 'settings':
        this.activeTab = 6;
        break;
      case 'purchase-orders':
        this.activeTab = 7;
        break;
      default:
        this.activeTab = 0;
    }
    return;
  }

  get calculatePeriod(): string {
    const start = this.project?.startingDate;
    const end = this.project?.endingDate;
    const periodDays = Math.floor(
      (Date.UTC(end?.getFullYear(), end?.getMonth(), end?.getDate()) -
        Date.UTC(start?.getFullYear(), start?.getMonth(), start?.getDate())) /
        (1000 * 60 * 60 * 24)
    );
    const periodMonths = Math.floor(periodDays / 30);
    return this._translateService
      .instant('Projects.projectDetails.periodValue')
      .replace('{{days}}', periodDays)
      .replace('{{months}}', periodMonths);
  }

  changeTab(tab: number, path: string, termId?: string) {
    this.router.navigate(['/projects/project-details/' + this.projectId + '/' + path], {
      queryParams: { term: termId },
    });
    this.activeTab = tab;
  }

  goToActivityTab() {
    this.changeTab(5, '/activity-logs/requests-logs/');
  }

  getTermId(e?: any) {
    if (e) {
      this.changeTab(2, 'tasks/', e);
    } else {
      this.changeTab(2, 'tasks/');
    }
  }

  goToTeamTab() {
    this.changeTab(3, 'team/');
  }

  ngOnDestroy(): void {
    this._projectService.setprojectUsers({});
  }

  goToTasksAndFilter(quantity: IProjectQuantityVm) {
    this.changeTab(2, 'tasks/', quantity.id);
  }
}
