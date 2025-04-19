import { Component, inject, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BankGuaranteeDto,
  BankGuaranteeVm,
  BankVm,
  ContractClient,
  ContractFileVM,
  SavingType,
} from '@core/api';
import {
  FileUploadComponent,
  FileUploaded,
} from '@core/shared/components/file-upload/file-upload.component';
import { numberToArabicWords } from '@core/shared/utils/numbers-to-arabic-words';
import { numberToWords } from '@core/shared/utils/numbers-to-word';
import { environment } from '@env/environment';
import { ContractFileUpload } from '@modules/contracts/shared/contract-file-upload';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { GuaranteeAwardDateOrderValidator } from '@modules/contracts/shared/validators/guarantee-award-date.validator';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import {
  filter,
  firstValueFrom,
  map,
  of,
  startWith,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';

type GuaranteeForm = FormGroup<{
  receivedOrganization: FormControl<string>;
  bankGuaranteePercentage: FormControl<number>;
  isBankHasFinalGuarantee: FormControl<boolean>;
  awardTotalPrice: FormControl<number>;
  bankGuaranteeAmount: FormControl<number>;
  bankGuaranteeValidityFrom: FormControl<NgbDate>;
  bankGuaranteeValidityTo: FormControl<NgbDate>;
  awardOrderIssuanceDate: FormControl<NgbDate>;
  notes: FormControl<string>;
  bankId: FormControl<string>;
  bankGuaranteeAmountInLetters: FormControl<string>;
  awardTotalPriceInLetters: FormControl<string>;
}>;

@Component({
  selector: 'app-contract-guarantee',
  templateUrl: './contract-guarantee.component.html',
  styleUrl: './contract-guarantee.component.scss',
})
export class ContractGuaranteeComponent
  extends ContractFileUpload
  implements ContractFormStepper, OnInit, OnDestroy
{
  private readonly fb = inject(FormBuilder);
  private readonly _contractClient = inject(ContractClient);

  private percentageChangeSub: Subscription;
  private bankGuaranteeAmountSub: Subscription;
  private isBankHasGuaranteeChangeSub: Subscription;
  private bankGuaranteeFromChangeSub: Subscription;

  @ViewChild(FileUploadComponent, { read: FileUploadComponent })
  fileuploadComponent: FileUploadComponent;

  constructor() {
    super({ stepNumber: 4 });
  }

  title: string;

  banks: Signal<BankVm[]> = toSignal(
    this._contractClient.getBanks(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  contractForm: GuaranteeForm = this.fb.group(
    {
      bankGuaranteePercentage: [0, [Validators.required]],
      bankGuaranteeAmount: [{ value: 0, disabled: true }],
      awardTotalPriceInLetters: [{ value: null, disabled: true }],
      bankGuaranteeValidityFrom: [null],
      bankGuaranteeValidityTo: [null],
      bankId: [''],
      awardTotalPrice: [{ value: 0, disabled: true }],
      awardOrderIssuanceDate: [{ value: null, disabled: true }],
      isBankHasFinalGuarantee: [true],
      notes: [null],
      receivedOrganization: [''],
      bankGuaranteeAmountInLetters: [{ value: null, disabled: true }],
    },
    {
      validators: [GuaranteeAwardDateOrderValidator()],
    }
  );

  translation: any;

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.guarantee')
    );

    this.bankGuaranteePercentageChange();
    this.isBankHasGuaranteeChange();
    this.bankGuaranteeFromChange();
    this.bankGuaranteeAccountChange();
  }

  bankGuaranteeFromChange() {
    this.bankGuaranteeFromChangeSub = this.contractForm.valueChanges
      .pipe(
        tap(() => {
          if (this.contractForm.hasError('guaranteeDate_LessThanAwardDate')) {
            this.bankGuaranteeValidityFrom.setErrors({
              guaranteeDate_LessThanAwardDate: true,
            });
          } else {
            this.bankGuaranteeValidityFrom.setErrors(null);
          }
        })
      )
      .subscribe();
  }

  get bankId(): FormControl<string> {
    return this.contractForm.controls.bankId;
  }
  get bankGuaranteePercentage(): FormControl<number> {
    return this.contractForm.controls.bankGuaranteePercentage;
  }
  get bankGuaranteeValidityFrom(): FormControl<NgbDate> {
    return this.contractForm.controls.bankGuaranteeValidityFrom;
  }
  get bankGuaranteeValidityTo(): FormControl<NgbDate> {
    return this.contractForm.controls.bankGuaranteeValidityTo;
  }

  get awardTotalPrice(): FormControl<number> {
    return this.contractForm.controls.awardTotalPrice;
  }
  get bankGuaranteeAmount(): FormControl<number> {
    return this.contractForm.controls.bankGuaranteeAmount;
  }
  get isBankHasFinalGuarantee(): FormControl<boolean> {
    return this.contractForm.controls.isBankHasFinalGuarantee;
  }
  get notes(): FormControl<string> {
    return this.contractForm.controls.notes;
  }
  get receivedOrganization(): FormControl<string> {
    return this.contractForm.controls.receivedOrganization;
  }
  get bankGuaranteeAmountInLetters(): FormControl<string> {
    return this.contractForm.controls.bankGuaranteeAmountInLetters;
  }
  get awardTotalPriceInLetters(): FormControl<string> {
    return this.contractForm.controls.awardTotalPriceInLetters;
  }
  get awardOrderIssuanceDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.awardOrderIssuanceDate;
  }

  private bankGuaranteePercentageChange() {
    this.percentageChangeSub = this.bankGuaranteePercentage.valueChanges
      .pipe(
        filter(() => this.bankGuaranteePercentage.valid),
        tap((percent: number) => {
          const dis: number = percent / 100;
          this.bankGuaranteeAmount.setValue(this.awardTotalPrice.value * dis);
          this.bankGuaranteeAmount.markAsUntouched();
        }),
        switchMap(of)
      )
      .subscribe();
  }

  private bankGuaranteeAccountChange(): void {
    this.bankGuaranteeAmountSub = this.bankGuaranteeAmount.valueChanges
      .pipe(
        tap((value: number) => {
          if (this._translateService.currentLang === 'en') {
            this.bankGuaranteeAmountInLetters.setValue(numberToWords(value));
          } else {
            this.bankGuaranteeAmountInLetters.setValue(numberToArabicWords(value));
          }
          this.bankGuaranteeAmountInLetters.markAsUntouched();
        }),
        switchMap(of)
      )
      .subscribe();
  }

  private isBankHasGuaranteeChange() {
    this.isBankHasGuaranteeChangeSub = this.isBankHasFinalGuarantee.valueChanges
      .pipe(
        tap(() => this.notes.markAsDirty()),
        startWith(this.isBankHasFinalGuarantee.value),
        switchMap(of)
      )
      .subscribe((hasGuarantee: boolean) => {
        if (hasGuarantee === true) {
          this.notes.setValue(null);
          this.bankId.addValidators(Validators.required);
          this.bankGuaranteePercentage.addValidators(Validators.required);
          this.receivedOrganization.addValidators(Validators.required);
        } else if (hasGuarantee === false) {
          this.bankId.clearValidators();
          this.bankGuaranteePercentage.clearValidators();
          this.receivedOrganization.clearValidators();
        }
        this.notes.updateValueAndValidity();
        this.bankId.updateValueAndValidity();
        this.bankGuaranteePercentage.updateValueAndValidity();
        this.receivedOrganization.updateValueAndValidity();
      });
  }

  getData() {
    return this._contractClient
      .getContractBankGuarantee(
        this._contractFormService.currentContractId(),
        environment.apiVersion
      )
      .pipe(
        tap((bankGuaranteeInfo: BankGuaranteeVm) => {
          if (bankGuaranteeInfo.awardTotalPrice) {
            if (this._translateService.currentLang === 'en') {
              this.awardTotalPriceInLetters.setValue(
                numberToWords(bankGuaranteeInfo.awardTotalPrice)
              );
            } else {
              this.awardTotalPriceInLetters.setValue(
                numberToArabicWords(bankGuaranteeInfo.awardTotalPrice)
              );
            }
          }
          const files: FileUploaded[] = [];
          if (bankGuaranteeInfo.filesName && bankGuaranteeInfo.filesName.length) {
            bankGuaranteeInfo.filesName.forEach((file: ContractFileVM) => {
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
        map((info: BankGuaranteeVm) => {
          return {
            ...info,
            bankGuaranteeValidityFrom: info.bankGuaranteeValidityFrom
              ? {
                  year: info.bankGuaranteeValidityFrom.getFullYear(),
                  month: info.bankGuaranteeValidityFrom.getMonth() + 1,
                  day: info.bankGuaranteeValidityFrom.getDate(),
                }
              : null,
            bankGuaranteeValidityTo: info.bankGuaranteeValidityTo
              ? {
                  year: info.bankGuaranteeValidityTo.getFullYear(),
                  month: info.bankGuaranteeValidityTo.getMonth() + 1,
                  day: info.bankGuaranteeValidityTo.getDate(),
                }
              : null,
            awardOrderIssuanceDate: info.awardOrderIssuanceDate
              ? {
                  year: info.awardOrderIssuanceDate.getFullYear(),
                  month: info.awardOrderIssuanceDate.getMonth() + 1,
                  day: info.awardOrderIssuanceDate.getDate(),
                }
              : null,
          };
        })
      );
  }

  postData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.guarantee.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
      bankGuaranteePercentage: +this.bankGuaranteePercentage.value,
      bankGuaranteeValidityFrom: !this.isBankHasFinalGuarantee.value
        ? null
        : this.bankGuaranteeValidityFrom.value
        ? new Date(
            Date.UTC(
              this.bankGuaranteeValidityFrom.value.year,
              this.bankGuaranteeValidityFrom.value.month - 1,
              this.bankGuaranteeValidityFrom.value.day
            )
          )
        : new Date('0001-01-01'),
      bankGuaranteeValidityTo: !this.isBankHasFinalGuarantee.value
        ? null
        : this.bankGuaranteeValidityTo.value
        ? new Date(
            Date.UTC(
              this.bankGuaranteeValidityTo.value.year,
              this.bankGuaranteeValidityTo.value.month - 1,
              this.bankGuaranteeValidityTo.value.day
            )
          )
        : new Date('0001-01-01'),
    } as BankGuaranteeDto;
    return this._contractFormService.addGuaranteeData(dto, successMsg);
  }

  putData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.guarantee.savesuccess'
    );
    const dto = {
      ...this.contractForm.value,
      savingType,
      bankGuaranteePercentage: +this.bankGuaranteePercentage.value,
      contractId: this._contractFormService.currentContractId(),
      bankGuaranteeValidityFrom: this.bankGuaranteeValidityFrom.value
        ? new Date(
            Date.UTC(
              this.bankGuaranteeValidityFrom.value.year,
              this.bankGuaranteeValidityFrom.value.month - 1,
              this.bankGuaranteeValidityFrom.value.day
            )
          )
        : new Date('0001-01-01'),
      bankGuaranteeValidityTo: this.bankGuaranteeValidityTo.value
        ? new Date(
            Date.UTC(
              this.bankGuaranteeValidityTo.value.year,
              this.bankGuaranteeValidityTo.value.month - 1,
              this.bankGuaranteeValidityTo.value.day
            )
          )
        : new Date('0001-01-01'),
    } as BankGuaranteeDto;
    return this._contractFormService.updateGuaranteeData(
      this._contractFormService.currentStepId(),
      dto,
      successMsg
    );
  }

  isBankGuranteeChanged(event: Event) {
    const value = (event.target as HTMLInputElement).checked;
    if (!value) {
      const awardPrice: number = this.awardTotalPrice.value;
      this.contractForm.reset();
      this.bankGuaranteePercentage.setValue(0);
      this.isBankHasFinalGuarantee.setValue(false);
      this.awardTotalPrice.setValue(awardPrice);
    } else {
      this.isBankHasFinalGuarantee.setValue(true);
    }
  }

  ngOnDestroy(): void {
    if (this.percentageChangeSub) {
      this.percentageChangeSub.unsubscribe();
    }
    if (this.isBankHasGuaranteeChangeSub) {
      this.isBankHasGuaranteeChangeSub.unsubscribe();
    }
    if (this.bankGuaranteeFromChangeSub) {
      this.bankGuaranteeFromChangeSub.unsubscribe();
    }
    if (this.bankGuaranteeAmountSub) {
      this.bankGuaranteeAmountSub.unsubscribe();
    }
  }
}
