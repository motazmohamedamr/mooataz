import {
  Component,
  EventEmitter,
  Inject,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountListVm,
  FileResponse,
  HttpResultOfString,
  PeriodDto,
  ProjectDto,
  ProjectsClient,
  SavingType,
} from '@core/api';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { ProjectOperation } from '../contract-operations.component';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { filter, first, firstValueFrom, Subscription, tap } from 'rxjs';
import { environment } from '@env/environment';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProjectReceiptDateValidator } from '@modules/contracts/shared/validators/project-receipt-date.validator';
import { receiptDateContractSigningValidator } from '@modules/contracts/shared/validators/site-receipt-contract-signing';
import { addToNgbDate } from '@modules/contracts/shared/utils/add-to-date';

export type ProjectForm = FormGroup<{
  name: FormControl<string>;
  userId: FormControl<string>;
  siteReceiptDate: FormControl<NgbDate>;
  sitePrimaryReceiptDate: FormControl<NgbDate>;
  siteFinalReceiptDate: FormControl<NgbDate>;
  contractSigningDate: FormControl<NgbDate>;
  period: FormControl<PeriodDto>;
  bankGuaranteeValidityTo: FormControl<NgbDate>;
  siteImage: FormControl<string>;
}>;

type DialogData = {
  isDialog: boolean;
  users: AccountListVm[];
  operationToBeEdited: ProjectOperation;
  projects: ProjectOperation[];
  mode: 'add' | 'edit';
};

@Component({
  selector: 'app-operations-form',
  templateUrl: './operations-form.component.html',
  styleUrl: './operations-form.component.scss',
})
export class OperationsFormComponent implements OnInit, OnDestroy {
  @Output() save = new EventEmitter<ProjectOperation>();

  translation: any;
  projectFormChanges: Subscription;
  siteReceiptDateSubscription: Subscription;

  @Input()
  projects: ProjectOperation[] = [];

  loading = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  protected readonly _translateService = inject(TranslateService);
  protected readonly _contractFormService = inject(ContractFormService);
  private readonly _projectClient = inject(ProjectsClient);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.users = data.users;
    if (data.operationToBeEdited) {
      this.projectForm.patchValue({
        name: data.operationToBeEdited.name,
        userId: data.operationToBeEdited?.userId,
        period: data.operationToBeEdited.period,
        siteReceiptDate: data.operationToBeEdited?.siteReceiptDate
          ? new NgbDate(
              data.operationToBeEdited.siteReceiptDate.getFullYear(),
              data.operationToBeEdited.siteReceiptDate.getMonth() + 1,
              data.operationToBeEdited.siteReceiptDate.getDate()
            )
          : null,
        sitePrimaryReceiptDate: data.operationToBeEdited?.sitePrimaryReceiptDate
          ? new NgbDate(
              data.operationToBeEdited.sitePrimaryReceiptDate.getFullYear(),
              data.operationToBeEdited.sitePrimaryReceiptDate.getMonth() + 1,
              data.operationToBeEdited.sitePrimaryReceiptDate.getDate()
            )
          : null,
        siteFinalReceiptDate: data.operationToBeEdited?.siteFinalReceiptDate
          ? new NgbDate(
              data.operationToBeEdited.siteFinalReceiptDate.getFullYear(),
              data.operationToBeEdited.siteFinalReceiptDate.getMonth() + 1,
              data.operationToBeEdited.siteFinalReceiptDate.getDate()
            )
          : null,
        contractSigningDate: data.operationToBeEdited?.contractSigningDate
          ? new NgbDate(
              data.operationToBeEdited.contractSigningDate.getFullYear(),
              data.operationToBeEdited.contractSigningDate.getMonth() + 1,
              data.operationToBeEdited.contractSigningDate.getDate()
            )
          : null,
        bankGuaranteeValidityTo: data.operationToBeEdited?.bankGuaranteeValidityTo
          ? new NgbDate(
              data.operationToBeEdited.bankGuaranteeValidityTo.getFullYear(),
              data.operationToBeEdited.bankGuaranteeValidityTo.getMonth() + 1,
              data.operationToBeEdited.bankGuaranteeValidityTo.getDate()
            )
          : null,
      });
      if (data.mode === 'add' && data.operationToBeEdited.bankGuaranteeValidityTo) {
        this.siteFinalReceiptDate.setValue(
          addToNgbDate(
            new NgbDate(
              data.operationToBeEdited.bankGuaranteeValidityTo.getFullYear(),
              data.operationToBeEdited.bankGuaranteeValidityTo.getMonth() + 1,
              data.operationToBeEdited.bankGuaranteeValidityTo.getDate()
            ),
            1,
            0,
            0
          )
        );
      }
    }
    if (data.projects && Array.isArray(data.projects)) {
      this.projects = data.projects;
    }
  }

  @Input()
  users: AccountListVm[] = [];

  projectForm: ProjectForm = this.fb.group(
    {
      name: ['', [Validators.required]],
      siteReceiptDate: [inject(NgbCalendar).getToday(), [Validators.required]],
      sitePrimaryReceiptDate: [inject(NgbCalendar).getToday(), [Validators.required]],
      siteFinalReceiptDate: [inject(NgbCalendar).getToday(), [Validators.required]],
      userId: ['', Validators.required],
      siteImage: [''],
      contractSigningDate: [{ value: null, disabled: true }],
      bankGuaranteeValidityTo: [{ value: null, disabled: true }],
      period: [{ value: null, disabled: true }],
    },
    {
      validators: [receiptDateContractSigningValidator()],
    }
  );

  get name(): FormControl<string> {
    return this.projectForm.controls.name;
  }
  get userId(): FormControl<string> {
    return this.projectForm.controls.userId;
  }
  get siteReceiptDate(): FormControl<NgbDate> {
    return this.projectForm.controls.siteReceiptDate;
  }
  get sitePrimaryReceiptDate(): FormControl<NgbDate> {
    return this.projectForm.controls.sitePrimaryReceiptDate;
  }
  get siteFinalReceiptDate(): FormControl<NgbDate> {
    return this.projectForm.controls.siteFinalReceiptDate;
  }
  get contractSigningDate(): FormControl<NgbDate> {
    return this.projectForm.controls.contractSigningDate;
  }
  get period(): FormControl<PeriodDto> {
    return this.projectForm.controls.period;
  }

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.operations')
    );
    if (this.projects && this.projects.length === 0) {
      this.name.setValue(this.translation.firstOperation);
    }

    this.siteReceiptDateSubscription = this.siteReceiptDate.valueChanges.subscribe(
      (value) => {
        this.sitePrimaryReceiptDate.setValue(
          addToNgbDate(
            value,
            this.period.value.years,
            this.period.value.months,
            this.period.value.days
          )
        );
      }
    );

    this.projectFormChanges = this.projectForm.valueChanges
      .pipe(
        filter(
          () => this.sitePrimaryReceiptDate.valid || this.siteFinalReceiptDate.valid
        ),
        tap(() => {
          if (
            this.projectForm.hasError(
              'contractPrimaryReceiptDate_PrimaryReceiptDateLessThanFinalDate'
            )
          ) {
            this.siteFinalReceiptDate.setErrors({
              contractPrimaryReceiptDate_PrimaryReceiptDateLessThanFinalDate: true,
            });
          } else {
            this.siteFinalReceiptDate.setErrors(null);
          }

          if (
            this.projectForm.hasError(
              'contractReceiptDate_receiptDateLessThanSigningDate'
            )
          ) {
            this.siteReceiptDate.setErrors({
              contractReceiptDate_receiptDateLessThanSigningDate: true,
            });
          } else {
            this.siteReceiptDate.setErrors(null);
          }
        })
      )
      .subscribe();
  }

  async createOperation(): Promise<void> {
    this.loading.set(true);
    const newOperation = {
      ...this.projectForm.value,
      contractId: this._contractFormService.currentContractId(),
      savingType: SavingType.Save,
      siteReceiptDate: this.siteReceiptDate.value
        ? new Date(
            Date.UTC(
              this.siteReceiptDate.value.year,
              this.siteReceiptDate.value.month - 1,
              this.siteReceiptDate.value.day
            )
          )
        : new Date('0001-01-01'),
      siteFinalReceiptDate: this.siteFinalReceiptDate.value
        ? new Date(
            Date.UTC(
              this.siteFinalReceiptDate.value.year,
              this.siteFinalReceiptDate.value.month - 1,
              this.siteFinalReceiptDate.value.day
            )
          )
        : new Date('0001-01-01'),
      sitePrimaryReceiptDate: this.sitePrimaryReceiptDate.value
        ? new Date(
            Date.UTC(
              this.sitePrimaryReceiptDate.value.year,
              this.sitePrimaryReceiptDate.value.month - 1,
              this.sitePrimaryReceiptDate.value.day
            )
          )
        : new Date('0001-01-01'),
    } as ProjectDto;
    console.log(this.data);
    try {
      let response: HttpResultOfString | FileResponse;
      if (this.data?.operationToBeEdited?.id) {
        response = await firstValueFrom(
          this._projectClient.updateProject(
            this.data.operationToBeEdited.id,
            environment.apiVersion,
            newOperation
          )
        );
        this.save.emit({
          id: this.data.operationToBeEdited.id,
          stepNumber: 6,
          contractId: this._contractFormService.currentContractId(),
          name: newOperation.name,
          siteReceiptDate: newOperation.siteReceiptDate,
          sitePrimaryReceiptDate: newOperation.sitePrimaryReceiptDate,
          siteFinalReceiptDate: newOperation.siteFinalReceiptDate,
          userId: newOperation.userId,
          userName: this.users?.find((user) => user.id === newOperation.userId)?.username,
        });
      } else {
        response = await firstValueFrom(
          this._projectClient.createProject(environment.apiVersion, newOperation)
        );
        if (response.result) {
          // if lastStep is 5, enable el benood (next step)
          if (this._contractFormService.lastStep() === 5) {
            this._contractFormService.lastStep.set(7);
            this._contractFormService.stepEnabled.set(8);
          }
          this.save.emit({
            id: response.result,
            stepNumber: 6,
            contractId: this._contractFormService.currentContractId(),
            name: newOperation.name,
            siteReceiptDate: newOperation.siteReceiptDate,
            siteFinalReceiptDate: newOperation.siteFinalReceiptDate,
            sitePrimaryReceiptDate: newOperation.sitePrimaryReceiptDate,
            siteImage: newOperation.siteImage,
            userId: newOperation.userId,
            userName: this.users?.find((user) => user.id === newOperation.userId)
              ?.username,
          });
        }
      }
    } catch (error) {
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.projectFormChanges) {
      this.projectFormChanges.unsubscribe();
    }
    if (this.siteReceiptDateSubscription) {
      this.siteReceiptDateSubscription.unsubscribe();
    }
  }
}
