import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ContractClient, IContractFineVm, SavingType } from '@core/api';
import { ContractFormStepper } from '@modules/contracts/shared/contract-form-stepper.interface';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { first, firstValueFrom, Observable, take, tap } from 'rxjs';
import { ContractFinesFormComponent } from './contract-fines-form/contract-fines-form.component';

@Component({
  selector: 'app-contract-fines',
  templateUrl: './contract-fines.component.html',
  styleUrl: './contract-fines.component.scss',
})
export class ContractFinesComponent implements ContractFormStepper, OnInit {
  title: string;

  protected readonly _translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  protected readonly _contractFormService = inject(ContractFormService);
  private readonly _contractsClient = inject(ContractClient);

  contractForm: FormGroup<any> = this.fb.group({
    hasFines: false,
  });

  translation: any;

  fines = signal<IContractFineVm[]>([]);

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.fines')
    );
  }

  getData() {
    return this._contractsClient
      .getContractFine(this._contractFormService.currentContractId())
      .pipe(
        tap((fines: IContractFineVm[]) => {
          this.contractForm.patchValue({
            hasFines: fines.length > 0,
          });
          this.fines.set(fines);
        })
      );
  }

  addNewFine(fine: IContractFineVm) {
    this.fines.update((fines) => [...fines, fine]);
    this.contractForm.patchValue({
      hasFines: true,
    });
  }

  openNewFineDialog(): void {
    const dialogRef = this.dialog.open(ContractFinesFormComponent, {
      data: {
        isDialog: true,
        fines: this.fines(),
      },
    });
    dialogRef.componentInstance.save.pipe(take(1)).subscribe((fine: IContractFineVm) => {
      this.addNewFine(fine);
      dialogRef.close();
    });
  }

  deleteFine(fine: IContractFineVm): void {
    this._contractsClient
      .deleteContractFine(fine.id)
      .pipe(
        first(),
        tap(() => {
          this.fines.update((fines) => fines.filter((pr) => pr.id !== fine.id));
          this.contractForm.patchValue({
            hasFines: this.fines().length > 0,
          });
        })
      )
      .subscribe();
  }

  openEditFineDialog(fine: IContractFineVm): void {
    const dialogRef = this.dialog.open(ContractFinesFormComponent, {
      data: {
        isDialog: true,
        fineToBeEdited: fine,
        fines: this.fines(),
      },
    });
    dialogRef.componentInstance.save.pipe(take(1)).subscribe((fine: IContractFineVm) => {
      this.fines.update((fines) =>
        fines.map((pr) => (pr.id === fine.id ? { ...fine } : pr))
      );
      dialogRef.close();
    });
  }

  postData: (savingType: SavingType) => Observable<any>;
  putData: (savingType: SavingType) => Observable<any>;
}
