import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ProjectMainDataVm, ProjectsClient, SavingType } from '@core/api';
import { environment } from '@env/environment';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { first, firstValueFrom, Observable, tap } from 'rxjs';

type ProjectMainData = ProjectMainDataVm & {
  getQuantities: boolean;
};

@Component({
  selector: 'app-contract-operation-quantities',
  templateUrl: './contract-operation-quantities.component.html',
  styleUrl: './contract-operation-quantities.component.scss',
})
export class ContractOperationQuantitiesComponent implements ContractFormStepper, OnInit {
  title: string;
  contractForm: FormGroup<any>;

  projects = signal<ProjectMainData[]>([]);

  protected readonly _translateService = inject(TranslateService);
  private readonly _projectClient = inject(ProjectsClient);
  protected readonly _toaster = inject(ToastrService);
  protected readonly _contractFormService = inject(ContractFormService);
  translation: any;

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.quantities')
    );
    // this.dialog.open(ContractQuantityFormComponent, {
    //   data: { isDialog: true, allProjects: this.projects() },
    // });
  }

  getData() {
    return this._projectClient
      .getProjectMainData(
        this._contractFormService.currentContractId(),
        environment.apiVersion
      )
      .pipe(
        tap((projects: ProjectMainDataVm[]) => {
          this.projects.set(
            projects.map((proj) => {
              return {
                id: proj.id,
                name: proj.name,
                totalPrice: proj.totalPrice,
                getQuantities: false,
              } as ProjectMainData;
            })
          );
        })
      );
  }
  postData: (savingType: SavingType) => Observable<any>;
  putData: (savingType: SavingType) => Observable<any>;

  downloadQuantities(project: ProjectMainDataVm): void {
    this._projectClient
      .uploadProjectQuantities(project.id, environment.apiVersion)
      .pipe(first())
      .subscribe((fileResponse) => {
        let url = window.URL.createObjectURL(fileResponse.data);
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = fileResponse.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this._toaster.success(this.translation.downloadComplete, '', {
          positionClass: 'toast-bottom-center',
        });
      });
  }

  toggleQuantitiesAccordion(ev: Event, projectId: string) {
    const target = ev.target as HTMLInputElement;
    const checked = target.checked;
    if (checked) {
      this.projects.update((projects) =>
        projects.map((project) =>
          project.id === projectId
            ? ({ ...project, getQuantities: true } as ProjectMainData)
            : project
        )
      );
    }
  }

  changeOperationPrice(
    obj: {
      oldTotalPrice?: number;
      totalPrice: number;
      operation: 'add' | 'edit' | 'delete' | 'replace';
    },
    project: ProjectMainDataVm
  ) {
    if (obj.operation === 'add') {
      this.projects.update((projects) =>
        projects.map((proj) =>
          proj.id === project.id
            ? ({
                ...proj,
                totalPrice: proj.totalPrice + obj.totalPrice,
              } as ProjectMainData)
            : proj
        )
      );
    } else if (obj.operation === 'delete') {
      this.projects.update((projects) =>
        projects.map((proj) =>
          proj.id === project.id
            ? ({
                ...proj,
                totalPrice: proj.totalPrice - obj.totalPrice,
              } as ProjectMainData)
            : proj
        )
      );
    } else if (obj.operation === 'edit') {
      this.projects.update((projects) =>
        projects.map((proj) =>
          proj.id === project.id
            ? ({
                ...proj,
                totalPrice: proj.totalPrice - obj.oldTotalPrice + obj.totalPrice,
              } as ProjectMainData)
            : proj
        )
      );
    } else if (obj.operation === 'replace') {
      this.projects.update((projects) =>
        projects.map((proj) =>
          proj.id === project.id
            ? ({
                ...proj,
                totalPrice: obj.totalPrice,
              } as ProjectMainData)
            : proj
        )
      );
    }
  }
}
