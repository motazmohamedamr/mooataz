import { Component, inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ClientsClient,
  ClientVm,
  CompetitionType,
  ContractClient,
  ContractMainDataDto,
  CountriesClient,
  CountryVm,
  SavingType,
} from '@core/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, startWith, Subscription, tap } from 'rxjs';
import { environment } from '@env/environment';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';

type ContractDetailsForm = FormGroup<{
  name: FormControl<string>;
  refNumber: FormControl<string>;
  countryId: FormControl<string>;
  clientId: FormControl<string>;
  competitionType: FormControl<number>;
}>;

type ContractTypes = {
  label: string;
  value: number;
};

@Component({
  selector: 'app-contract-main-form',
  templateUrl: './contract-main-form.component.html',
  styleUrl: './contract-main-form.component.scss',
})
export class ContractMainFormComponent implements OnInit, ContractFormStepper, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly _countriesClient = inject(CountriesClient);
  private readonly _clientsClient = inject(ClientsClient);
  private readonly _contractClient = inject(ContractClient);
  private readonly _contractFormService = inject(ContractFormService);
  private readonly translate = inject(TranslateService);

  competitionChangeSub: Subscription;

  countries: Signal<CountryVm[]> = toSignal(
    this._countriesClient.getAllCountries(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );
  clients: Signal<ClientVm[]> = toSignal(
    this._clientsClient.getActiveClients(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  translation: any;
  _translateService = inject(TranslateService);

  contractTypes: ContractTypes[] = Object.entries(CompetitionType)
    .map(([label, value]) => ({
      label: this._translateService.instant(`contract.form.details.${label}`),
      value: +value,
    }))
    .slice(2);

  contractForm: ContractDetailsForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    clientId: ['', [Validators.required]],
    countryId: ['', [Validators.required]],
    refNumber: ['', [Validators.maxLength(16)]],
    competitionType: [0, [Validators.required]],
  });

  title: string = '';

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.details')
    );

    this.competitionChangeSub = this.competitionType.valueChanges
      .pipe(
        tap(() => this.refNumber.markAsDirty()),
        startWith(this.competitionType.value)
      )
      .subscribe((type: number) => {
        const requiredVal = Validators.required;
        if (type == 0) {
          this.refNumber.enable();
          this.refNumber.addValidators([requiredVal]);
        } else if (type == 1) {
          this.refNumber.removeValidators([requiredVal]);
          this.refNumber.setValue(null);
          this.refNumber.disable();
        }
        this.refNumber.updateValueAndValidity();
      });
  }

  get name(): FormControl<string> {
    return this.contractForm.controls.name;
  }
  get clientId(): FormControl<string> {
    return this.contractForm.controls.clientId;
  }
  get countryId(): FormControl<string> {
    return this.contractForm.controls.countryId;
  }
  get refNumber(): FormControl<string> {
    return this.contractForm.controls.refNumber;
  }
  get competitionType(): FormControl<number> {
    return this.contractForm.controls.competitionType;
  }

  get formSuccessMsg(): string {
    return this.translate.instant('contract.form.details.savesuccess');
  }

  getData() {
    return this._contractClient.getContractMainData(
      this._contractFormService.currentContractId(),
      environment.apiVersion
    );
  }
  postData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.details.savesuccess'
    );
    const formDto = this.contractForm.value as ContractMainDataDto;
    return this._contractFormService.addContractMainData(formDto, successMsg);
  }
  putData(savingType: SavingType) {
    const successMsg = this._translateService.instant(
      'contract.form.details.savesuccess'
    );
    const formDto = this.contractForm.value as ContractMainDataDto;
    return this._contractFormService.updateContractMainData(
      this._contractFormService.currentContractId(),
      formDto,
      successMsg
    );
  }

  ngOnDestroy(): void {
    if (this.competitionChangeSub) {
      this.competitionChangeSub.unsubscribe();
    }
  }
}
