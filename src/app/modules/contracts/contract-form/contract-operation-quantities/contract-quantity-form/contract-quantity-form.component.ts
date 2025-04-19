import { numberToArabicWords } from '@core/shared/utils/numbers-to-arabic-words';
import {
  Component,
  EventEmitter,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  Output,
  Signal,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  BusinessType,
  FileResponse,
  HttpResultOfString,
  IProjectQuantityVm,
  MeasurementUnitsClient,
  MeasurementUnitVm,
  ProjectMainDataVm,
  ProjectQuantityDto,
  ProjectQuantityVm,
  ProjectsClient,
  SavingType,
} from '@core/api';
import { numberToWords } from '@core/shared/utils/numbers-to-word';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom, of, Subscription, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';

type QuantityForm = FormGroup<{
  title: FormControl<string>;
  itemNumber: FormControl<number>;
  description: FormControl<string>;
  specifications: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
  businessType: FormControl<number>;
  totalPrice: FormControl<string>;
  projectId: FormControl<string>;
  measurementUnitId: FormControl<string>;
}>;

type DialogData = {
  isDialog: boolean;
  quantityToBeEdited: ProjectQuantityVm;
  allProjects: ProjectMainDataVm[];
  selectedProject: ProjectMainDataVm;
};

type ConType = {
  label: string;
  value: number;
};

@Component({
  selector: 'app-contract-quantity-form',
  templateUrl: './contract-quantity-form.component.html',
  styleUrl: './contract-quantity-form.component.scss',
})
export class ContractQuantityFormComponent implements OnInit, OnDestroy {
  protected readonly _translateService = inject(TranslateService);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _contractFormService = inject(ContractFormService);
  protected readonly fb = inject(FormBuilder);

  unitPriceSub: Subscription;
  quantitySub: Subscription;

  @Output() save = new EventEmitter<{
    project: IProjectQuantityVm;
    totalPrice: number;
    operation: 'add' | 'edit' | 'delete';
  }>();

  loading = signal<boolean>(false);

  measurementUnits: Signal<MeasurementUnitVm[]> = toSignal(
    this._measurementUnitsClient.getAll(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  businessTypes: ConType[] = Object.entries(BusinessType)
    .map(([label, value]) => ({
      label: this._translateService.instant(
        `contract.form.quantities.businessType.${label}`
      ),
      value: +value,
    }))
    .slice(Math.floor(Object.keys(BusinessType).length / 2));

  translation: any;

  quantityForm: QuantityForm = this.fb.group({
    title: ['', [Validators.required]],
    itemNumber: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required]],
    specifications: ['', [Validators.required]],
    unitPrice: [0, [Validators.required, Validators.min(1)]],
    businessType: [0, [Validators.required]],
    totalPrice: [{ value: '', disabled: true }, [Validators.required]],
    measurementUnitId: ['', [Validators.required]],
    projectId: [{ value: '', disabled: true }, [Validators.required]],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    if (data.quantityToBeEdited) {
      this.quantityForm.patchValue({
        ...data.quantityToBeEdited,
        projectId: data.selectedProject?.id,
        totalPrice:
          this._translateService.currentLang === 'en'
            ? numberToWords(data.quantityToBeEdited.totalPrice)
            : numberToArabicWords(data.quantityToBeEdited.totalPrice),
      });
    } else {
      this.quantityForm.patchValue({ projectId: data.selectedProject?.id });
    }
  }

  get title(): FormControl<string> {
    return this.quantityForm.controls.title as FormControl<string>;
  }
  get itemNumber(): FormControl<number> {
    return this.quantityForm.controls.itemNumber as FormControl<number>;
  }
  get quantity(): FormControl<number> {
    return this.quantityForm.controls.quantity as FormControl<number>;
  }
  get description(): FormControl<string> {
    return this.quantityForm.controls.description as FormControl<string>;
  }
  get specifications(): FormControl<string> {
    return this.quantityForm.controls.specifications as FormControl<string>;
  }
  get unitPrice(): FormControl<number> {
    return this.quantityForm.controls.unitPrice as FormControl<number>;
  }
  get businessType(): FormControl<number> {
    return this.quantityForm.controls.businessType as FormControl<number>;
  }
  get totalPrice(): FormControl<string> {
    return this.quantityForm.controls.totalPrice as FormControl<string>;
  }
  get measurementUnitId(): FormControl<string> {
    return this.quantityForm.controls.measurementUnitId as FormControl<string>;
  }
  get projectId(): FormControl<string> {
    return this.quantityForm.controls.projectId as FormControl<string>;
  }

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.quantities')
    );

    this.unitPrice.valueChanges
      .pipe(
        filter(() => this.unitPrice.valid && this.quantity.valid),
        tap(() => {
          const totalPriceValue = this.unitPrice.value * this.quantity.value;
          this.setTotalValue(totalPriceValue);
        }),
        switchMap(of)
      )
      .subscribe();

    this.quantity.valueChanges
      .pipe(
        filter(() => this.unitPrice.valid && this.quantity.valid),
        tap(() => {
          const totalPriceValue = this.unitPrice.value * this.quantity.value;
          this.setTotalValue(totalPriceValue);
        }),
        switchMap(of)
      )
      .subscribe();
  }

  private setTotalValue(num: number): void {
    if (this._translateService.currentLang === 'en') {
      this.totalPrice.setValue(numberToWords(num));
    } else {
      this.totalPrice.setValue(numberToArabicWords(num));
    }
  }

  async createQuantity(): Promise<void> {
    this.loading.set(true);
    const newQuantity = {
      ...this.quantityForm.value,
      savingType: SavingType.Save,
      projectId: this.data?.selectedProject?.id,
      quantity: +this.quantity.value,
      unitPrice: +this.unitPrice.value,
      businessType: +this.businessType.value,
      itemNumber: +this.itemNumber.value,
    } as ProjectQuantityDto;
    try {
      let response: HttpResultOfString | FileResponse;
      if (this.data.quantityToBeEdited) {
        response = await firstValueFrom(
          this._projectClient.updateProjectQuantity(
            this.data.quantityToBeEdited.id,
            environment.apiVersion,
            newQuantity
          )
        );
        this.save.emit({
          project: {
            id: this.data.quantityToBeEdited.id,
            ...newQuantity,
          },
          totalPrice: this.quantity.value * this.unitPrice.value,
          operation: 'edit',
        });
      } else {
        response = await firstValueFrom(
          this._projectClient.createProjectQuantity(
            this._contractFormService.currentContractId(),
            environment.apiVersion,
            newQuantity
          )
        );
        if (response.result) {
          this.save.emit({
            project: {
              id: response.result,
              ...newQuantity,
            },
            operation: 'add',
            totalPrice: this.quantity.value * this.unitPrice.value,
          });
        }
      }
    } catch (error) {
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.unitPriceSub) {
      this.unitPriceSub.unsubscribe();
    }
    if (this.quantitySub) {
      this.quantitySub.unsubscribe();
    }
  }
}
