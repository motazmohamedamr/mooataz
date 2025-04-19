import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ContractAwardInfoDto,
  ContractAwardInfoVm,
  ContractClient,
  ContractFileVM,
  IValueTupleOfStringAndString,
  SavingType,
} from '@core/api';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { numbersOnlyValidator } from '@modules/contracts/shared/validators/only-numbers.validator';
import { numberToWords } from '@core/shared/utils/numbers-to-word';
import { numberToArabicWords } from '@core/shared/utils/numbers-to-arabic-words';
import { environment } from '@env/environment';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import { NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  FileUploaderComponent,
  UploadedFile,
} from '@core/shared/components/file-uploader/file-uploader.component';
import { ContractFileUpload } from '@modules/contracts/shared/contract-file-upload';
import { gregorianToHijri } from '@modules/contracts/shared/converters/gregorian-date-to-hijri';
import { hijriToGregorian } from '@modules/contracts/shared/converters/hijri-to-gregorian';
import { FileUploadComponent } from '@core/shared/components/file-upload/file-upload.component';

type AwardForm = FormGroup<{
  awardNumber: FormControl<string>;
  awardOrderIssuanceDate: FormControl<NgbDate>;
  awardOrderIssuanceHijriDate: FormControl<NgbDate>;
  receiptAwardOrderDate: FormControl<NgbDate>;
  receiptAwardOrderHijriDate: FormControl<NgbDate>;
  itimadCompetitionNumber: FormControl<string>;
  displayNumber: FormControl<string>;
  initialTotalPrice: FormControl<number>;
  discountPercentage: FormControl<number>;
  discountValue: FormControl<number>;
  discountInLetters: FormControl<string>;
  vatPercentage: FormControl<number>;
  totalPriceAfterDiscount: FormControl<number>;
  finalTotalPrice: FormControl<number>;
  initialTotalPriceInLetters: FormControl<string>;
  finalPriceInLetters: FormControl<string>;
  vatValue: FormControl<number>;
  vatValueInLetters: FormControl<string>;
}>;

@Component({
  selector: 'app-award',
  templateUrl: './award.component.html',
  styleUrl: './award.component.scss',
})
export class AwardComponent
  extends ContractFileUpload
  implements ContractFormStepper, OnInit, OnDestroy
{
  private readonly fb = inject(FormBuilder);
  private readonly _contractClient = inject(ContractClient);

  @ViewChild(FileUploadComponent, { read: FileUploadComponent })
  fileuploaderComponent: FileUploadComponent;

  files: IValueTupleOfStringAndString[] = [];

  initialPriceChangeSub: Subscription;
  discountPerChangeSub: Subscription;
  vatPerChangeSub: Subscription;

  translation: any;

  minDate: NgbDateStruct;

  title: string;
  contractForm: AwardForm = this.fb.group({
    awardNumber: ['', [Validators.required]],
    displayNumber: ['', [Validators.required]],
    initialTotalPrice: [0, [Validators.required]],
    awardOrderIssuanceDate: [inject(NgbCalendar).getToday(), [Validators.required]],
    awardOrderIssuanceHijriDate: [inject(NgbCalendar).getToday(), [Validators.required]],
    discountPercentage: [0, [Validators.required]],
    discountInLetters: [{ value: 'صفر', disabled: true }],
    discountValue: [{ value: 0, disabled: true }],
    vatValueInLetters: [{ value: 'صفر', disabled: true }],
    vatValue: [{ value: 0, disabled: true }],
    initialTotalPriceInLetters: [{ value: 'صفر', disabled: true }],
    finalPriceInLetters: [{ value: 'صفر', disabled: true }],
    finalTotalPrice: [{ value: 0, disabled: true }],
    vatPercentage: [0, [Validators.required]],
    totalPriceAfterDiscount: [{ value: 0, disabled: true }],
    receiptAwardOrderHijriDate: [inject(NgbCalendar).getToday(), [Validators.required]],
    receiptAwardOrderDate: [inject(NgbCalendar).getToday(), [Validators.required]],
    itimadCompetitionNumber: ['', numbersOnlyValidator()],
  });

  constructor() {
    super({ stepNumber: 2 });
  }

  private changeDiscountLetters(num: number): void {
    if (this._translateService.currentLang === 'en') {
      this.discountInLetters.setValue(numberToWords(num));
    } else {
      this.discountInLetters.setValue(numberToArabicWords(num));
    }
    this.discountInLetters.markAsUntouched();
  }

  private initialPriceChangeHandler(): void {
    this.initialPriceChangeSub = this.initialTotalPrice.valueChanges
      .pipe(
        filter(() => this.initialTotalPrice.valid),
        tap((value: number) => {
          if (value !== null && this.discountPercentage.value != null) {
            const dis: number = this.discountPercentage.value / 100;
            this.discountValue.setValue(value * dis);
            this.discountValue.markAsUntouched();
            this.changeDiscountLetters(this.discountValue.value);
          }
          if (this._translateService.currentLang === 'en') {
            this.initialTotalPriceInLetters.setValue(numberToWords(value));
          } else {
            this.initialTotalPriceInLetters.setValue(numberToArabicWords(value));
          }
          this.initialTotalPriceInLetters.markAsUntouched();
          this.calculateFinalPrice();
        }),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.calculateFinalPrice())
      )
      .subscribe();
  }

  private discountPercentageChangeHandler(): void {
    this.discountPerChangeSub = this.discountPercentage.valueChanges
      .pipe(
        filter(() => this.discountPercentage.valid),
        tap((value: number) => {
          if (value !== null && this.initialTotalPrice.value != null) {
            const dis: number = value / 100;
            this.discountValue.setValue(this.initialTotalPrice.value * dis);
            this.discountValue.markAsUntouched();
            this.changeDiscountLetters(this.discountValue.value);
          }
          this.calculateFinalPrice();
        }),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.calculateFinalPrice())
      )
      .subscribe();
  }

  private vatPercentageChangeHandler(): void {
    this.vatPerChangeSub = this.vatPercentage.valueChanges
      .pipe(
        filter(() => this.vatPercentage.valid),
        tap((value: number) => {
          if (value !== null && this.initialTotalPrice.value != null) {
            const dis: number = value / 100;
            this.vatValue.setValue(this.initialTotalPrice.value * dis);
            this.vatValue.markAsUntouched();
            const vatvalue = this.vatValue.value.toFixed(2);
            if (this._translateService.currentLang === 'en') {
              this.vatValueInLetters.setValue(numberToWords(+vatvalue));
            } else {
              this.vatValueInLetters.setValue(numberToArabicWords(+vatvalue));
            }
            this.vatValueInLetters.markAsUntouched();
          }
          this.calculateFinalPrice();
        }),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.calculateFinalPrice())
      )
      .subscribe();
  }

  private calculateFinalPrice(): Observable<number | null> {
    if (
      this.initialTotalPrice.value === 0 &&
      this.vatPercentage.value === 0 &&
      this.discountPercentage.value === 0
    )
      return of(null);
    if (
      this.initialTotalPrice.valid &&
      this.vatPercentage.valid &&
      this.discountPercentage.valid
    ) {
      return this._contractClient
        .calculateFinalPrice(
          this.initialTotalPrice.value,
          this.discountPercentage.value,
          this.vatPercentage.value,
          environment.apiVersion
        )
        .pipe(
          tap((val) => {
            this.finalTotalPrice.setValue(val);
            if (this._translateService.currentLang === 'en') {
              this.finalPriceInLetters.setValue(numberToWords(val));
            } else {
              this.finalPriceInLetters.setValue(numberToArabicWords(val));
            }
            this.finalTotalPrice.markAsUntouched();
            this.finalPriceInLetters.markAsUntouched();
          })
        );
    }
    return of(null);
  }

  async ngOnInit() {
    const now = new Date();
    this.minDate = {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.award')
    );
    if (this._translateService.currentLang === 'en') {
      this.discountInLetters.setValue('zero');
      this.discountInLetters.markAsUntouched();

      this.initialTotalPriceInLetters.setValue('zero');
      this.initialTotalPriceInLetters.markAsUntouched();

      this.finalPriceInLetters.setValue('zero');
      this.finalPriceInLetters.markAsUntouched();
    }

    this.initialPriceChangeHandler();
    this.discountPercentageChangeHandler();
    this.vatPercentageChangeHandler();
  }

  get awardNumber(): FormControl<string> {
    return this.contractForm.controls.awardNumber;
  }
  get awardOrderIssuanceDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.awardOrderIssuanceDate;
  }
  get receiptAwardOrderDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.receiptAwardOrderDate;
  }

  get awardOrderIssuanceHijriDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.awardOrderIssuanceHijriDate;
  }
  get receiptAwardOrderHijriDate(): FormControl<NgbDateStruct> {
    return this.contractForm.controls.receiptAwardOrderHijriDate;
  }
  get displayNumber(): FormControl<string> {
    return this.contractForm.controls.displayNumber;
  }
  get itimadCompetitionNumber(): FormControl<string> {
    return this.contractForm.controls.itimadCompetitionNumber;
  }
  get discountPercentage(): FormControl<number> {
    return this.contractForm.controls.discountPercentage;
  }
  get vatPercentage(): FormControl<number> {
    return this.contractForm.controls.vatPercentage;
  }
  get discountValue(): FormControl<number> {
    return this.contractForm.controls.discountValue;
  }
  get discountInLetters(): FormControl<string> {
    return this.contractForm.controls.discountInLetters;
  }
  get initialTotalPrice(): FormControl<number> {
    return this.contractForm.controls.initialTotalPrice;
  }
  get initialTotalPriceInLetters(): FormControl<string> {
    return this.contractForm.controls.initialTotalPriceInLetters;
  }
  get finalPriceInLetters(): FormControl<string> {
    return this.contractForm.controls.finalPriceInLetters;
  }
  get vatValue(): FormControl<number> {
    return this.contractForm.controls.vatValue;
  }
  get vatValueInLetters(): FormControl<string> {
    return this.contractForm.controls.vatValueInLetters;
  }
  get finalTotalPrice(): FormControl<number> {
    return this.contractForm.controls.finalTotalPrice;
  }

  getData() {
    return this._contractClient
      .getContractAwardInfo(
        this._contractFormService.currentContractId(),
        environment.apiVersion
      )
      .pipe(
        tap((awardInfo: ContractAwardInfoVm) => {
          const files: UploadedFile[] = [];
          if (awardInfo.files && awardInfo.files.length) {
            awardInfo.files.forEach((file: ContractFileVM) => {
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
        }),
        map((info: ContractAwardInfoVm) => {
          return {
            ...info,
            awardOrderIssuanceDate: info.awardOrderIssuanceDate
              ? {
                  year: info.awardOrderIssuanceDate.getFullYear(),
                  month: info.awardOrderIssuanceDate.getMonth() + 1,
                  day: info.awardOrderIssuanceDate.getDate(),
                }
              : null,
            awardOrderIssuanceHijriDate: info.awardOrderIssuanceHijriDate
              ? {
                  year: info.awardOrderIssuanceHijriDate.getFullYear(),
                  month: info.awardOrderIssuanceHijriDate.getMonth() + 1,
                  day: info.awardOrderIssuanceHijriDate.getDate(),
                }
              : null,
            receiptAwardOrderDate: info.receiptAwardOrderDate
              ? {
                  year: info.receiptAwardOrderDate.getFullYear(),
                  month: info.receiptAwardOrderDate.getMonth() + 1,
                  day: info.receiptAwardOrderDate.getDate(),
                }
              : null,
            receiptAwardOrderHijriDate: info.receiptAwardOrderHijriDate
              ? {
                  year: info.receiptAwardOrderHijriDate.getFullYear(),
                  month: info.receiptAwardOrderHijriDate.getMonth() + 1,
                  day: info.receiptAwardOrderHijriDate.getDate(),
                }
              : null,
          };
        })
      );
  }

  postData(savingType: SavingType) {
    const successMsg = this._translateService.instant('contract.form.award.savesuccess');
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
      vatPercentage: +this.vatPercentage.value,
      discountPercentage: +this.discountPercentage.value,
      initialTotalPrice: +this.initialTotalPrice.value,
      awardOrderIssuanceHijriDate: this.awardOrderIssuanceHijriDate.value
        ? new Date(
            Date.UTC(
              this.awardOrderIssuanceHijriDate.value.year,
              this.awardOrderIssuanceHijriDate.value.month - 1,
              this.awardOrderIssuanceHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      awardOrderIssuanceDate: this.awardOrderIssuanceDate.value
        ? new Date(
            Date.UTC(
              this.awardOrderIssuanceDate.value.year,
              this.awardOrderIssuanceDate.value.month - 1,
              this.awardOrderIssuanceDate.value.day
            )
          )
        : new Date('0001-01-01'),
      receiptAwardOrderHijriDate: this.receiptAwardOrderHijriDate.value
        ? new Date(
            Date.UTC(
              this.receiptAwardOrderHijriDate.value.year,
              this.receiptAwardOrderHijriDate.value.month - 1,
              this.receiptAwardOrderHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      receiptAwardOrderDate: this.receiptAwardOrderDate.value
        ? new Date(
            Date.UTC(
              this.receiptAwardOrderDate.value.year,
              this.receiptAwardOrderDate.value.month - 1,
              this.receiptAwardOrderDate.value.day
            )
          )
        : new Date('0001-01-01'),
    } as ContractAwardInfoDto;
    return this._contractFormService.addAwardData(dto, successMsg);
  }

  putData(savingType: SavingType) {
    const successMsg = this._translateService.instant('contract.form.award.savesuccess');
    const dto = {
      ...this.contractForm.value,
      savingType,
      contractId: this._contractFormService.currentContractId(),
      vatPercentage: +this.vatPercentage.value,
      discountPercentage: +this.discountPercentage.value,
      initialTotalPrice: +this.initialTotalPrice.value,
      awardOrderIssuanceHijriDate: this.awardOrderIssuanceHijriDate.value
        ? new Date(
            Date.UTC(
              this.awardOrderIssuanceHijriDate.value.year,
              this.awardOrderIssuanceHijriDate.value.month - 1,
              this.awardOrderIssuanceHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      awardOrderIssuanceDate: this.awardOrderIssuanceDate.value
        ? new Date(
            Date.UTC(
              this.awardOrderIssuanceDate.value.year,
              this.awardOrderIssuanceDate.value.month - 1,
              this.awardOrderIssuanceDate.value.day
            )
          )
        : new Date('0001-01-01'),
      receiptAwardOrderHijriDate: this.receiptAwardOrderHijriDate.value
        ? new Date(
            Date.UTC(
              this.receiptAwardOrderHijriDate.value.year,
              this.receiptAwardOrderHijriDate.value.month - 1,
              this.receiptAwardOrderHijriDate.value.day
            )
          )
        : new Date('0001-01-01'),
      receiptAwardOrderDate: this.receiptAwardOrderDate.value
        ? new Date(
            Date.UTC(
              this.receiptAwardOrderDate.value.year,
              this.receiptAwardOrderDate.value.month - 1,
              this.receiptAwardOrderDate.value.day
            )
          )
        : new Date('0001-01-01'),
    } as ContractAwardInfoDto;
    return this._contractFormService.updateAwardData(
      this._contractFormService.currentStepId(),
      dto,
      successMsg
    );
  }

  get currency(): string {
    return this._translateService.currentLang === 'en' ? 'Saudi Riyal' : 'ريال سعودي';
  }

  awardOrderIssuanceDateChanged(date: NgbDateStruct) {
    if (date) {
      this.awardOrderIssuanceHijriDate.setValue(
        gregorianToHijri(new Date(`${date.year}/${date.month}/${date.day}`))
      );
      this.awardOrderIssuanceHijriDate.updateValueAndValidity();
    }
  }

  awardOrderIssuanceHijriDateChanged(date: NgbDateStruct) {
    if (!date) return;
    const ngbdate: NgbDateStruct = {
      year: date.year,
      month: date.month,
      day: date.day,
    };
    this.awardOrderIssuanceDate.setValue(hijriToGregorian(ngbdate));
    this.awardOrderIssuanceDate.updateValueAndValidity();
  }

  receiptAwardOrderDateChanged(date: NgbDateStruct) {
    if (date) {
      this.receiptAwardOrderHijriDate.setValue(
        gregorianToHijri(new Date(`${date.year}/${date.month}/${date.day}`))
      );
      this.receiptAwardOrderHijriDate.updateValueAndValidity();
    }
  }

  receiptAwardOrderHijriDateChanged(date: NgbDateStruct) {
    if (date) {
      const ngbdate: NgbDateStruct = {
        year: date.year,
        month: date.month,
        day: date.day,
      };
      this.receiptAwardOrderDate.setValue(hijriToGregorian(ngbdate));
      this.receiptAwardOrderDate.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    if (this.initialPriceChangeSub) {
      this.initialPriceChangeSub.unsubscribe();
    }
    if (this.discountPerChangeSub) {
      this.discountPerChangeSub.unsubscribe();
    }
    if (this.vatPerChangeSub) {
      this.vatPerChangeSub.unsubscribe();
    }
  }
}
