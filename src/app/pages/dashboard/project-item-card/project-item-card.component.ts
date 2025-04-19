import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ProjectListingVm, ProjectStatus } from '@core/api';
import { ProjectsService } from '@modules/projects/projects.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-item-card',
  templateUrl: './project-item-card.component.html',
  styleUrl: './project-item-card.component.scss',
})
export class ProjectItemCardComponent implements OnChanges {
  protected readonly _translateService = inject(TranslateService);
  protected readonly _projectService = inject(ProjectsService);
  protected readonly cdr = inject(ChangeDetectorRef);

  @Input() project: ProjectListingVm;
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
