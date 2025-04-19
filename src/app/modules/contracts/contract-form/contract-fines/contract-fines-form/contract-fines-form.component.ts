import {
  Component,
  EventEmitter,
  inject,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ContractClient,
  ContractFineDto,
  FileResponse,
  HttpResultOfString,
  IContractFineVm,
  SavingType,
} from '@core/api';
import { numberToArabicWords } from '@core/shared/utils/numbers-to-arabic-words';
import { numberToWords } from '@core/shared/utils/numbers-to-word';
import { environment } from '@env/environment';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription, take, tap } from 'rxjs';

type FineForm = FormGroup<{
  description: FormControl<string>;
  amount: FormControl<number>;
  daysCount: FormControl<number>;
  amountInLetters: FormControl<string>;
}>;

type DialogData = {
  isDialog: boolean;
  fineToBeEdited: IContractFineVm;
  fines: IContractFineVm[];
};

@Component({
  selector: 'app-contract-fines-form',
  templateUrl: './contract-fines-form.component.html',
  styleUrl: './contract-fines-form.component.scss',
})
export class ContractFinesFormComponent implements OnInit, OnDestroy {
  @Output() save = new EventEmitter<IContractFineVm>();

  translation: any;
  fineAmountChanges: Subscription;

  @Input()
  fines: IContractFineVm[] = [];

  loading = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  protected readonly _translateService = inject(TranslateService);
  protected readonly _contractFormService = inject(ContractFormService);
  private readonly _contractClient = inject(ContractClient);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    if (data.fineToBeEdited) {
      this.fineForm.patchValue({
        amount: +data.fineToBeEdited.amount,
        daysCount: 0,
        description: data.fineToBeEdited.description,
        amountInLetters:
          this._translateService.currentLang === 'en'
            ? numberToWords(data.fineToBeEdited.amount)
            : numberToArabicWords(data.fineToBeEdited.amount),
      });
    }
    if (data.fines && Array.isArray(data.fines)) {
      this.fines = data.fines;
    }
  }

  fineForm: FineForm = this.fb.group({
    description: [''],
    amount: [0],
    daysCount: [],
    amountInLetters: [{ value: 'Zero', disabled: true }],
  });

  get amount(): FormControl<number> {
    return this.fineForm.controls.amount;
  }
  get daysCount(): FormControl<number> {
    return this.fineForm.controls.daysCount;
  }
  get description(): FormControl<string> {
    return this.fineForm.controls.description;
  }
  get amountInLetters(): FormControl<string> {
    return this.fineForm.controls.amountInLetters;
  }

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.fines')
    );
    this.amountFormChange();
  }

  private amountFormChange() {
    this.fineAmountChanges = this.amount.valueChanges
      .pipe(
        tap((amount) => {
          if (amount) {
            if (this._translateService.currentLang === 'en') {
              this.amountInLetters.setValue(numberToWords(amount));
            } else {
              this.amountInLetters.setValue(numberToArabicWords(amount));
            }
          } else {
            this.amountInLetters.setValue('Zero');
          }
        })
      )
      .subscribe();
  }

  async createFine(): Promise<void> {
    this.loading.set(true);
    const newFine = {
      ...this.fineForm.value,
      amount: +this.amount.value,
      daysCount: 0,
      contractId: this._contractFormService.currentContractId(),
      savingType: SavingType.Save,
    } as ContractFineDto;
    try {
      let response: HttpResultOfString | FileResponse;
      if (this.data.fineToBeEdited) {
        response = await firstValueFrom(
          this._contractClient.updateContractFine(this.data.fineToBeEdited.id, newFine)
        );
        this.save.emit({
          id: this.data.fineToBeEdited.id,
          stepNumber: 8,
          contractId: this._contractFormService.currentContractId(),
          amount: newFine.amount,
          daysCount: 0,
          description: newFine.description,
        });
      } else {
        response = await firstValueFrom(
          this._contractClient.createFine(environment.apiVersion, newFine)
        );
        if (response.result) {
          this.save.emit({
            id: response.result,
            stepNumber: 6,
            contractId: this._contractFormService.currentContractId(),
            amount: newFine.amount,
            daysCount: 0,
            description: newFine.description,
          });
        }
      }
    } catch (error) {
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.fineAmountChanges) {
      this.fineAmountChanges.unsubscribe();
    }
  }
}
