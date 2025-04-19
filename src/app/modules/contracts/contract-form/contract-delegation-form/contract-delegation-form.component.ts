import { Component, inject, OnInit, Signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountListVm,
  AccountsClient,
  AttachmentType,
  CommerceChambersClient,
  CommerceChamberVm,
  ContractFileVM,
  DelegationDto,
  DelegationsClient,
  DelegationVm,
  FileParameter,
  FilesClient,
  IValueTupleOfStringAndString,
  SavingType,
} from '@core/api';
import { FileUploadComponent } from '@core/shared/components/file-upload/file-upload.component';
import { UploadedFile } from '@core/shared/components/file-uploader/file-uploader.component';
import { environment } from '@env/environment';
import { ContractFileUpload } from '@modules/contracts/shared/contract-file-upload';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { first, firstValueFrom, Observable, tap } from 'rxjs';

type DelegationForm = FormGroup<{
  documentNumber: FormControl<number>;
  delegatedToName: FormControl<string>;
  notes: FormControl<string>;
  commerceChamberId: FormControl<string>;
}>;

@Component({
  selector: 'app-contract-delegation-form',
  templateUrl: './contract-delegation-form.component.html',
  styleUrl: './contract-delegation-form.component.scss',
})
export class ContractDelegationFormComponent
  extends ContractFileUpload
  implements ContractFormStepper, OnInit
{
  private readonly fb = inject(FormBuilder);
  private readonly _delegationsClient = inject(DelegationsClient);
  private readonly _commerceChambersClient = inject(CommerceChambersClient);
  private readonly _accountsClient = inject(AccountsClient);

  constructor() {
    super({ stepNumber: 3 });
  }

  @ViewChild(FileUploadComponent, { read: FileUploadComponent })
  fileuploaderComponent: FileUploadComponent;

  files: IValueTupleOfStringAndString[] = [];
  translation: any;

  title: string;
  contractForm: DelegationForm = this.fb.group({
    notes: [''],
    commerceChamberId: [''],
    delegatedToName: ['', [Validators.required]],
    documentNumber: [0, [Validators.required]],
  });

  commerceChambers: Signal<CommerceChamberVm[]> = toSignal(
    this._commerceChambersClient.getAll(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  users: Signal<AccountListVm[]> = toSignal(
    this._accountsClient.getList(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.delegation')
    );
  }

  get notes(): FormControl<string> {
    return this.contractForm.controls.notes;
  }
  get commerceChamberId(): FormControl<string> {
    return this.contractForm.controls.commerceChamberId;
  }
  get delegatedToName(): FormControl<string> {
    return this.contractForm.controls.delegatedToName;
  }
  get documentNumber(): FormControl<number> {
    return this.contractForm.controls.documentNumber;
  }

  getData() {
    return this._delegationsClient
      .getByContract(
        this._contractFormService.currentContractId(),
        environment.apiVersion
      )
      .pipe(
        tap((delegationInfo: DelegationVm) => {
          const files: UploadedFile[] = [];
          if (delegationInfo.files && delegationInfo.files.length) {
            delegationInfo.files.forEach((file: ContractFileVM) => {
              files.push({
                name: file.fileDisplayName,
                url: `${
                  environment.apiBaseUrl
                }/ContractFiles/${this._contractFormService.currentContractId()}/${
                  file.fileName
                }`,
                file: null,
              });
              this.files.push({
                item1: file.fileName,
              });
            });
            this.fileuploaderComponent.preFillFileData(files);
          }
        })
      );
  }

  postData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.delegation.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
    } as DelegationDto;
    return this._contractFormService.addDelegationData(dto, successMsg);
  }

  putData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.delegation.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
    } as DelegationDto;
    return this._contractFormService.updateDelegationData(
      this._contractFormService.currentStepId(),
      dto,
      successMsg
    );
  }
}
