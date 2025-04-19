import { Component, inject, Input } from '@angular/core';
import { ProjectDetailsVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-duration',
  templateUrl: './project-duration.component.html',
  styleUrl: './project-duration.component.scss',
})
export class ProjectDurationComponent {
  protected translate = inject(TranslateService);

  @Input() translation: any;
  @Input() projectDetails: ProjectDetailsVm;

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}

