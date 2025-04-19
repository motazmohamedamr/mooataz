import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  AccountListVm,
  AccountsClient,
  IContractProjectVm,
  ProjectDto,
  ProjectsClient,
  SavingType,
} from '@core/api';
import { environment } from '@env/environment';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { first, firstValueFrom, Observable, take, tap } from 'rxjs';
import { OperationsFormComponent } from './operations-form/operations-form.component';

export type ProjectOperation = IContractProjectVm & { userName: string };

@Component({
  selector: 'app-contract-operations',
  templateUrl: './contract-operations.component.html',
  styleUrl: './contract-operations.component.scss',
})
export class ContractOperationsComponent implements OnInit, ContractFormStepper {
  title: string;

  protected readonly _translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly _accountsClient = inject(AccountsClient);

  contractForm: FormGroup<any> = this.fb.group({
    hasOperations: false,
  });

  translation: any;

  projects = signal<ProjectOperation[]>([]);

  users: Signal<AccountListVm[]> = toSignal(
    this._accountsClient.getList(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.operations')
    );
  }

  protected readonly _contractFormService = inject(ContractFormService);
  private readonly _projectClient = inject(ProjectsClient);

  getData() {
    return this._projectClient
      .getProject(this._contractFormService.currentContractId(), environment.apiVersion)
      .pipe(
        tap((projects: IContractProjectVm[]) => {
          const allProjects: ProjectOperation[] = projects.map((project) => ({
            ...project,
            userName: this.users().find((user) => user.id === project.userId)?.username,
          }));
          this.contractForm.patchValue({
            hasOperations: projects.length > 0,
          });
          this.projects.set(allProjects);
        })
      );
  }

  addNewProject(project: ProjectOperation) {
    this.projects.update((projects) => [...projects, project]);
    this.contractForm.patchValue({
      hasOperations: true,
    });
  }

  openNewOperationDialog(): void {
    const dialogRef = this.dialog.open(OperationsFormComponent, {
      data: {
        isDialog: true,
        users: this.users(),
        projects: this.projects(),
        mode: 'add',
        operationToBeEdited: {
          bankGuaranteeValidityTo:
            this.projects().length > 0
              ? new Date(this.projects()[0].bankGuaranteeValidityTo).getTime() ===
                new Date('0001-01-01T00:00:00').getTime()
                ? null
                : this.projects()[0].bankGuaranteeValidityTo
              : null,
          period: this.projects().length > 0 ? this.projects()[0].period : null,
        },
      },
    });
    dialogRef.componentInstance.save.pipe(take(1)).subscribe((proj: ProjectOperation) => {
      this.addNewProject(proj);
      dialogRef.close();
    });
  }

  deleteProject(project: ProjectOperation): void {
    this._projectClient
      .deleteProject(project.id, environment.apiVersion)
      .pipe(
        first(),
        tap(() => {
          this.projects.update((projects) =>
            projects.filter((pr) => pr.id !== project.id)
          );
          this.contractForm.patchValue({
            hasOperations: this.projects().length > 0,
          });
        })
      )
      .subscribe();
  }

  openEditOperationDialog(project: ProjectOperation): void {
    const dialogRef = this.dialog.open(OperationsFormComponent, {
      width: '800px',
      data: {
        isDialog: true,
        users: this.users(),
        mode: 'edit',
        operationToBeEdited: {
          ...project,
          period: project.period,
          siteReceiptDate:
            new Date(project.siteReceiptDate).getTime() ===
            new Date('0001-01-01T00:00:00').getTime()
              ? null
              : project.siteReceiptDate,
          sitePrimaryReceiptDate:
            new Date(project.sitePrimaryReceiptDate).getTime() ===
            new Date('0001-01-01T00:00:00').getTime()
              ? null
              : project.sitePrimaryReceiptDate,
          siteFinalReceiptDate:
            new Date(project.siteFinalReceiptDate).getTime() ===
            new Date('0001-01-01T00:00:00').getTime()
              ? null
              : project.siteFinalReceiptDate,
          contractSigningDate:
            new Date(project.contractSigningDate).getTime() ===
            new Date('0001-01-01T00:00:00').getTime()
              ? null
              : project.contractSigningDate,
          bankGuaranteeValidityTo:
            new Date(project.bankGuaranteeValidityTo).getTime() ===
            new Date('0001-01-01T00:00:00').getTime()
              ? null
              : project.bankGuaranteeValidityTo,
        },
        projects: this.projects(),
      },
    });
    dialogRef.componentInstance.save.pipe(take(1)).subscribe((proj: ProjectOperation) => {
      this.projects.update((projects) =>
        projects.map((pr) => (pr.id === proj.id ? { ...proj } : pr))
      );
      dialogRef.close();
    });
  }

  postData: (savingType: SavingType) => Observable<any>;
  putData: (savingType: SavingType) => Observable<any>;
}
