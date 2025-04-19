import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { IProjectListingVm, ProjectStatus } from '@core/api';
import { ProjectsService } from '@modules/projects/projects.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-list-item',
  templateUrl: './project-list-item.component.html',
  styleUrl: './project-list-item.component.scss',
})
export class ProjectListItemComponent implements OnChanges {
  protected readonly _translateService = inject(TranslateService);
  protected readonly _projectService = inject(ProjectsService);
  protected readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true })
  project: IProjectListingVm;

  projectStatus = ProjectStatus;

  projectImageUrl: string = '';

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes?.project?.currentValue) {
      const project = changes.project.currentValue;
      if (project?.siteImage) {
        this.projectImageUrl = await this._projectService.download(
          this.project.siteImage
        );
      } else {
        this.projectImageUrl = '';
      }
      this.cdr.detectChanges();
    }
  }
}
