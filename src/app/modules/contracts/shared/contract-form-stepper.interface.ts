import { FormGroup } from '@angular/forms';
import { SavingType } from '@core/api';
import { Observable } from 'rxjs';

export interface ContractFormStepper {
  title: string;
  contractForm: FormGroup;
  getData: (id: string, apiVersion: string) => Observable<any>;
  postData: (savingType: SavingType) => Observable<any>;
  putData: (savingType: SavingType) => Observable<any>;
}

export interface ContractStepper {
  title?: string;
  subtitle?: string;
  route: string;
  disabled: boolean;
}
