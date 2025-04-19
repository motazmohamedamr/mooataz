import { Component, inject, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ClientsClient,
  ClientVm,
  ContractClient,
  ContractDetailsDto,
  ContractDetailsVm,
  ContractFileVM,
  ContractStatus,
  ContractTypesClient,
  ContractTypeVm,
  SavingType,
} from '@core/api';
import {
  FileUploadComponent,
  FileUploaded,
} from '@core/shared/components/file-upload/file-upload.component';
import { environment } from '@env/environment';
import { ContractFileUpload } from '@modules/contracts/shared/contract-file-upload';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { gregorianToHijri } from '@modules/contracts/shared/converters/gregorian-date-to-hijri';
import { hijriToGregorian } from '@modules/contracts/shared/converters/hijri-to-gregorian';
import { contractIssuanceDateValidator } from '@modules/contracts/shared/validators/contract-issuance-date.validator';
import { contractIssuanceDateGuaranteeValidator } from '@modules/contracts/shared/validators/contract-issuance-guarantee.validator';
import { contractSigningDateValidator } from '@modules/contracts/shared/validators/contract-signing.validator';
import { NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import { filter, firstValueFrom, map, of, Subscription, switchMap, tap } from 'rxjs';

type ContractDetailForm = FormGroup<{
  name: FormControl<string>;
  refNumber: FormControl<string>;
  issuanceDate: FormControl<NgbDate>;
  issuanceHijriDate: FormControl<NgbDate>;
  contractSigningDate: FormControl<NgbDate>;
  bankGuaranteeValidityFrom: FormControl<NgbDate>;
  dateReceiptHardCopy: FormControl<NgbDate>;
  days: FormControl<number>;
  years: FormControl<number>;
  months: FormControl<number>;
  contractStatus: FormControl<number>;
  contractTypeId: FormControl<string>;
  clientId: FormControl<string>;
  awardOrderIssuanceDate: FormControl<NgbDate>;
}>;

type ContractStatusList = {
  id: number;
  name: string;
}[];

@Component({
  selector: 'app-contract-detail-form',
  templateUrl: './contract-detail-form.component.html',
  styleUrl: './contract-detail-form.component.scss',
})
export class ContractDetailFormComponent
  extends ContractFileUpload
  implements ContractFormStepper, OnInit, OnDestroy
{
  private readonly fb = inject(FormBuilder);
  private readonly _contractClient = inject(ContractClient);
  private readonly _clientsClient = inject(ClientsClient);
  private readonly _contractTypesClient = inject(ContractTypesClient);

  formChangesSub: Subscription;
  issuanceHijriDateSub: Subscription;
  issuanceDateSub: Subscription;

  @ViewChild(FileUploadComponent, { read: FileUploadComponent })
  fileuploadComponent: FileUploadComponent;

  contractStatusTranslated: Record<string, string> = this._translateService.instant(
    'contract.table.statuses'
  );

  contractStatuses: ContractStatusList = Object.entries(ContractStatus)
    .slice(Math.floor(Object.keys(ContractStatus).length) / 2)
    .map((st: [string, string | ContractStatus]) => {
      return {
        id: +st[1],
        name: this.contractStatusTranslated[st[0].toLowerCase()],
      };
    });

  clients: Signal<ClientVm[]> = toSignal(
    this._clientsClient.getAllClients(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  contractTypes: Signal<ContractTypeVm[]> = toSignal(
    this._contractTypesClient.getAllContractTypes(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  title: string;

  contractForm: ContractDetailForm = this.fb.group(
    {
      clientId: ['', [Validators.required]],
      contractSigningDate: [inject(NgbCalendar).getToday(), [Validators.required]],
      contractStatus: [ContractStatus.InProgress, [Validators.required]],
      contractTypeId: ['', [Validators.required]],
      dateReceiptHardCopy: [null],
      issuanceDate: [inject(NgbCalendar).getToday(), [Validators.required]],
      issuanceHijriDate: [null],
      name: [{ value: '', disabled: true }],
      days: [0, [Validators.required]],
      years: [0, [Validators.required]],
      months: [0, [Validators.required]],
      refNumber: [{ value: '', disabled: true }],
      awardOrderIssuanceDate: [{ disabled: true, value: null }],
      bankGuaranteeValidityFrom: [{ disabled: true, value: null }],
    },
    {
      validators: [
        // contractIssuanceDateValidator(),
        contractSigningDateValidator(),
        contractIssuanceDateGuaranteeValidator(),
      ],
      updateOn: 'blur',
    }
  );

  constructor() {
    super({ stepNumber: 5 });
  }

  get clientId(): FormControl<string> {
    return this.contractForm.controls.clientId;
  }
  get contractSigningDate(): FormControl<NgbDate> {
    return this.contractForm.controls.contractSigningDate;
  }
  get issuanceDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.issuanceDate;
  }
  get issuanceHijriDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.issuanceHijriDate;
  }
  get dateReceiptHardCopy(): FormControl<NgbDate> {
    return this.contractForm.controls.dateReceiptHardCopy;
  }
  get contractStatus(): FormControl<number> {
    return this.contractForm.controls.contractStatus;
  }
  get contractTypeId(): FormControl<string> {
    return this.contractForm.controls.contractTypeId;
  }
  get name(): FormControl<string> {
    return this.contractForm.controls.name;
  }
  get days(): FormControl<number> {
    return this.contractForm.controls.days;
  }
  get months(): FormControl<number> {
    return this.contractForm.controls.months;
  }
  get years(): FormControl<number> {
    return this.contractForm.controls.years;
  }
  get refNumber(): FormControl<string> {
    return this.contractForm.controls.refNumber;
  }

  translation: any;

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.contractDetails')
    );

    // this.issuanceDateChanges();
    // this.issuanceHijriDateChanges();

    this.formChangesSub = this.contractForm.valueChanges
      .pipe(
        filter(() => this.issuanceDate.valid || this.contractSigningDate.valid),
        tap(() => {
          if (this.contractForm.hasError('issuanceDate_issuanceDateLessThanAwardDate')) {
            this.issuanceDate.setErrors({
              issuanceDate_issuanceDateLessThanAwardDate: true,
            });
          } else if (
            this.contractForm.hasError('issuanceDate_issuanceDateLessThanGuaranteeDate')
          ) {
            this.issuanceDate.setErrors({
              issuanceDate_issuanceDateLessThanGuaranteeDate: true,
            });
          } else {
            this.issuanceDate.setErrors(null);
          }

          if (
            this.contractForm.hasError(
              'contractSigningDate_signingDateLessThanIssuanceDate'
            )
          ) {
            this.contractSigningDate.setErrors({
              contractSigningDate_signingDateLessThanIssuanceDate: true,
            });
          } else {
            this.contractSigningDate.setErrors(null);
          }
        }),
        switchMap(of)
      )
      .subscribe();
  }

  issuanceDateChanged(date: NgbDateStruct) {
    if (date) {
      this.issuanceHijriDate.setValue(
        gregorianToHijri(new Date(`${date.year}/${date.month}/${date.day}`))
      );
      this.issuanceHijriDate.updateValueAndValidity();
    }
  }

  issuanceHijriDateChanged(date: NgbDateStruct) {
    if (date) {
      const ngbdate: NgbDateStruct = {
        year: date.year,
        month: date.month,
        day: date.day,
      };
      this.issuanceDate.setValue(hijriToGregorian(ngbdate));
      this.issuanceDate.updateValueAndValidity();
    }
  }

  getData() {
    return this._contractClient
      .getContractDetails(
        this._contractFormService.currentContractId(),
        environment.apiVersion
      )
      .pipe(
        tap((contractDetailsInfo: ContractDetailsVm) => {
          const files: FileUploaded[] = [];
          if (contractDetailsInfo.files && contractDetailsInfo.files.length) {
            contractDetailsInfo.files.forEach((file: ContractFileVM) => {
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
            this.fileuploadComponent.preFillFileData(files);
          }
        }),
        map((info: ContractDetailsVm) => {
          return {
            ...info,
            days: info.period ? info.period.days : 0,
            months: info.period ? info.period.months : 0,
            years: info.period ? info.period.years : 0,
            awardOrderIssuanceDate: info.awardOrderIssuanceDate
              ? {
                  year: info.awardOrderIssuanceDate.getFullYear(),
                  month: info.awardOrderIssuanceDate.getMonth() + 1,
                  day: info.awardOrderIssuanceDate.getDate(),
                }
              : null,
            issuanceHijriDate: info.issuanceHijriDate
              ? {
                  year: info.issuanceHijriDate.getFullYear(),
                  month: info.issuanceHijriDate.getMonth() + 1,
                  day: info.issuanceHijriDate.getDate(),
                }
              : null,
            issuanceDate: info.issuanceDate
              ? {
                  year: info.issuanceDate.getFullYear(),
                  month: info.issuanceDate.getMonth() + 1,
                  day: info.issuanceDate.getDate(),
                }
              : null,
            contractSigningDate: info.contractSigningDate
              ? {
                  year: info.contractSigningDate.getFullYear(),
                  month: info.contractSigningDate.getMonth() + 1,
                  day: info.contractSigningDate.getDate(),
                }
              : null,
            dateReceiptHardCopy: info.dateReceiptHardCopy
              ? {
                  year: info.dateReceiptHardCopy.getFullYear(),
                  month: info.dateReceiptHardCopy.getMonth() + 1,
                  day: info.dateReceiptHardCopy.getDate(),
                }
              : null,
            bankGuaranteeValidityFrom: info.bankGuaranteeValidityFrom
              ? {
                  year: info.bankGuaranteeValidityFrom.getFullYear(),
                  month: info.bankGuaranteeValidityFrom.getMonth() + 1,
                  day: info.bankGuaranteeValidityFrom.getDate(),
                }
              : null,
          };
        })
      );
  }

  postData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.contractDetails.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      clientId: this.clientId.value || null,
      savingType,
      contractId: this._contractFormService.currentContractId(),
      period: {
        days: +this.days.value,
        months: +this.months.value,
        years: +this.years.value,
      },
      contractSigningDate: this.contractSigningDate.value
        ? new Date(
            Date.UTC(
              this.contractSigningDate.value.year,
              this.contractSigningDate.value.month - 1,
              this.contractSigningDate.value.day
            )
          )
        : new Date('0001-01-01'),
      dateReceiptHardCopy: this.dateReceiptHardCopy.value
        ? new Date(
            Date.UTC(
              this.dateReceiptHardCopy.value.year,
              this.dateReceiptHardCopy.value.month - 1,
              this.dateReceiptHardCopy.value.day
            )
          )
        : new Date('0001-01-01'),
      issuanceDate: this.issuanceDate.value
        ? new Date(
            Date.UTC(
              this.issuanceDate.value.year,
              this.issuanceDate.value.month - 1,
              this.issuanceDate.value.day
            )
          )
        : new Date('0001-01-01'),
      issuanceHijriDate: this.issuanceHijriDate.value
        ? new Date(
            Date.UTC(
              this.issuanceHijriDate.value.year,
              this.issuanceHijriDate.value.month - 1,
              this.issuanceHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      refNumber: this.refNumber.value,
      name: this.name.value,
    } as ContractDetailsDto;
    return this._contractFormService.addDetailData(dto, successMsg);
  }

  putData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.contractDetails.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
      period: {
        days: +this.days.value,
        months: +this.months.value,
        years: +this.years.value,
      },
      contractSigningDate: this.contractSigningDate.value
        ? new Date(
            Date.UTC(
              this.contractSigningDate.value.year,
              this.contractSigningDate.value.month - 1,
              this.contractSigningDate.value.day
            )
          )
        : new Date('0001-01-01'),
      dateReceiptHardCopy: this.dateReceiptHardCopy.value
        ? new Date(
            Date.UTC(
              this.dateReceiptHardCopy.value.year,
              this.dateReceiptHardCopy.value.month - 1,
              this.dateReceiptHardCopy.value.day
            )
          )
        : new Date('0001-01-01'),
      issuanceDate: this.issuanceDate.value
        ? new Date(
            Date.UTC(
              this.issuanceDate.value.year,
              this.issuanceDate.value.month - 1,
              this.issuanceDate.value.day
            )
          )
        : new Date('0001-01-01'),
      issuanceHijriDate: this.issuanceHijriDate.value
        ? new Date(
            Date.UTC(
              this.issuanceHijriDate.value.year,
              this.issuanceHijriDate.value.month - 1,
              this.issuanceHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      refNumber: this.refNumber.value,
      name: this.name.value,
    } as ContractDetailsDto;
    return this._contractFormService.updateDetailData(
      this._contractFormService.currentStepId(),
      dto,
      successMsg
    );
  }

  ngOnDestroy(): void {
    if (this.formChangesSub) {
      this.formChangesSub.unsubscribe();
    }
    if (this.issuanceDateSub) {
      this.issuanceDateSub.unsubscribe();
    }
    if (this.issuanceHijriDateSub) {
      this.issuanceHijriDateSub.unsubscribe();
    }
  }
}
