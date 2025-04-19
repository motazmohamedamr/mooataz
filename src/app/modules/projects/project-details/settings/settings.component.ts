import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {
  AttachmentType,
  ProjectDetailsDto,
  ProjectDetailsVm,
  ProjectsClient,
  StorageFile,
} from '@core/api';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { environment } from '@env/environment';
import { ProjectsService } from '@modules/projects/projects.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { concatMap } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _projectsService = inject(ProjectsService);
  private readonly _projectsClient = inject(ProjectsClient);
  private readonly _translate = inject(TranslateService);
  private readonly toastr = inject(ToastrService);

  @Input() project: ProjectDetailsVm;
  @Input() projectImageUrl: string;
  @Output() refreshDetails = new EventEmitter<void>();
  newPictureUri: string;

  private updateProjectDetails(uniqueId: string) {
    return this._projectsClient.updateProjectDetails(
      this.project.id,
      environment.apiVersion,
      {
        name: this.project.name,
        siteImage: uniqueId,
        description: this.project.description,
        status: this.project.status,
      } as ProjectDetailsDto
    );
  }

  changePicture(event: Event) {
    const inputFile = event.target as HTMLInputElement;
    const file = inputFile.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      this.newPictureUri = URL.createObjectURL(file);
      this._cdr.detectChanges();
      const newID = generateGUID();

      const attachment = {
        file: file as any,
        uniqueKey: newID,
        displayName: file.name,
      } as StorageFile;
      this._projectsService.upload(
        environment.apiVersion,
        // @ts-ignore
        [attachment],
        AttachmentType.ProjectFiles.toString()
      );
      this.updateProjectDetails(newID)
        .pipe(
          concatMap(() =>
            this._projectsService.upload(
              environment.apiVersion,
              // @ts-ignore
              [attachment],
              AttachmentType.ProjectFiles.toString(),
              this.project.id
            )
          )
        )
        .subscribe(() => {
          this.refreshDetails.emit();
          this.toastr.success(
            this._translate.instant(
              'Projects.projectDetails.projectFileChangedSuccessfully'
            ),
            '',
            {
              positionClass: 'toast-bottom-center',
            }
          );
        });
    };
  }

  removePicture() {
    this.updateProjectDetails(null).subscribe(() => {
      this.refreshDetails.emit();
      this.toastr.success(
        this._translate.instant('Projects.projectDetails.projectFileChangedSuccessfully'),
        '',
        {
          positionClass: 'toast-bottom-center',
        }
      );
      this.newPictureUri = '';
      this.projectImageUrl = '';
      this._cdr.detectChanges();
    });
  }
}
