import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FileParameter, ProjectsClient, SavingType } from '@core/api';
import { ProjectOperation } from '../contract-operations.component';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { catchError, first, throwError } from 'rxjs';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-operations-table',
  templateUrl: './operations-table.component.html',
  styleUrl: './operations-table.component.scss',
})
export class OperationsTableComponent {
  protected translateService = inject(TranslateService);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _contractFormService = inject(ContractFormService);
  private readonly _handler = inject(ApiHandlerService);
  protected readonly _toaster = inject(ToastrService);

  @Input()
  projectList: ProjectOperation[] = [];

  @Input()
  translation: any;

  @Output()
  openEditEvent = new EventEmitter<ProjectOperation>();

  @Output()
  deletProjEvent = new EventEmitter<ProjectOperation>();

  openEditDialog(project: ProjectOperation): void {
    this.openEditEvent.emit(project);
  }

  deleteProj(project: ProjectOperation): void {
    this.deletProjEvent.emit(project);
  }

  fileChanged(event: Event, project: ProjectOperation) {
    const target = event.target as HTMLInputElement;
    const file: File = target.files[0];

    const fileParam: FileParameter = {
      data: file,
      fileName: file.name,
    };

    this._projectClient
      .addQuantitiesByExcel(
        environment.apiVersion,
        fileParam,
        this._contractFormService.currentContractId(),
        project.id,
        SavingType.Save.toString()
      )
      .pipe(
        first(),
        catchError((err) => {
          this._handler.handleError(err.error).pushError();
          return throwError(err);
        })
      )
      .subscribe(() => {
        this._toaster.success(
          this.translateService.instant(
            'contract.form.operations.quantitiesAddedSuccessfully'
          ),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }
}
