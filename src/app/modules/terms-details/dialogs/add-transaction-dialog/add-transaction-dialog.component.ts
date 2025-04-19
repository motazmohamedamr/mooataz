import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SuppliersClient } from '@core/api';
import { environment } from '@env/environment';
import { transactionRemainingValidator } from '@modules/terms-details/validators/transactions.validator';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, map, Subject, takeUntil } from 'rxjs';

type TransactionRequest = FormGroup<{
  date: FormControl<NgbDate>;
  amount: FormControl<number>;
  remain: FormControl<number>;
  supplierId: FormControl<string>;
}>;

@Component({
  selector: 'app-add-transaction-dialog',
  templateUrl: './add-transaction-dialog.component.html',
  styleUrl: './add-transaction-dialog.component.scss',
})
export class AddTransactionDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly _suppliersClient = inject(SuppliersClient);

  private destroy$ = new Subject<void>();

  suppliersDropdown = toSignal(this.getSuppliers(undefined), {
    rejectErrors: true,
    initialValue: [],
  });
  supplierSig = computed(() => signal(this.suppliersDropdown()));
  supplierList = computed(() => this.supplierSig()());

  protected readonly data: {
    translation: any;
    requestId: string;
    supplierId: string;
    supplierAvailable: boolean;
    lastRemainingAmount: number;
  } = inject(MAT_DIALOG_DATA);

  addTransactionForm = this.fb.group({
    supplyApprovalRequestId: [this.data.requestId],
    transactionRequests: this.fb.array<TransactionRequest>([]),
  });

  get transactionRequests() {
    return this.addTransactionForm.controls.transactionRequests;
  }

  ngOnInit(): void {
    this.addTransactionRequest();
  }

  addTransactionRequest() {
    const newCtrl = this.fb.group(
      {
        date: [
          new NgbDate(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            new Date().getDate()
          ),
          [Validators.required],
        ],
        amount: [0, [Validators.required, Validators.min(0.1)]],
        remain: [{ value: 0, disabled: true }],
        supplierId: [this.data?.supplierId || ''],
      },
      { validators: transactionRemainingValidator() }
    );
    this.transactionRequests.push(newCtrl);
    this.updateFormGroupStates();
    newCtrl
      .get('amount')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lastAmount =
          this.transactionRequests?.value.length > 1
            ? this.transactionRequests.getRawValue()[
                this.transactionRequests.getRawValue().length - 2
              ].remain || 0
            : this.data?.lastRemainingAmount || 0;
        newCtrl.get('remain')?.setValue(Number((lastAmount - value).toFixed(2)));
        if (newCtrl.get('remain')?.value < 0) {
          newCtrl.get('remain').setErrors({ lessthanzero: true });
        } else {
          newCtrl.get('remain').setErrors(null);
        }
      });
  }

  private updateFormGroupStates(): void {
    this.transactionRequests.controls.forEach((group, index) => {
      if (index === this.transactionRequests.controls.length - 1) {
        group.enable();
        group.get('remain')?.disable();
      } else {
        group.disable();
      }
    });
  }

  submit() {
    const formValue = {
      ...this.addTransactionForm.getRawValue(),
      transactionRequests: this.transactionRequests.getRawValue().map((request) => ({
        ...request,
        date: new Date(
          Date.UTC(request.date.year, request.date.month - 1, request.date.day)
        ).toISOString(),
      })),
    };
    this.dialogRef.close(formValue);
  }

  close(): void {
    this.dialogRef.close();
  }

  private getSuppliers(search: string | null | undefined) {
    return this._suppliersClient
      .getPage(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        search,
        undefined,
        undefined,
        environment.apiVersion
      )
      .pipe(map((i) => i.items));
  }

  async supplierSearchChanged(search: string) {
    const suppliers = await firstValueFrom(this.getSuppliers(search));
    this.supplierSig().set(suppliers);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
