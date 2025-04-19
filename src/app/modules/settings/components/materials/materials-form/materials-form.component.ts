import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  LocalizedStringDto,
  MaterialDto,
  MaterialVm,
  MaterialsClient,
  MeasurementUnitDto,
  MeasurementUnitVm,
  MeasurementUnitsClient,
} from '@core/api';
import { MODALS } from '@core/models';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { finalize, first, firstValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-materials-form',
  templateUrl: './materials-form.component.html',
  styleUrls: ['./materials-form.component.scss'],
})
export class MaterialsFormComponent implements OnInit {
  @Output() output = new EventEmitter();
  @Output() initialized = new EventEmitter();
  measurementUnits = signal<MeasurementUnitVm[]>([]);
  Modals = MODALS;

  newLogoUri: string;

  fetching = false;
  loading = false;
  testing = false;

  swalTranslation: any;
  translation: any;

  private readonly _materialsClient = inject(MaterialsClient);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly _translateService = inject(TranslateService);
  private readonly _handler = inject(ApiHandlerService);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef);
  protected readonly data: {
    item: MaterialVm;
  } = inject(MAT_DIALOG_DATA);

  form: FormGroup = this._fb.group({
    name: new FormGroup({
      ar: new FormControl(this.data?.item?.name?.ar || '', [Validators.required]),
      en: new FormControl(this.data?.item?.name?.en || '', [Validators.required]),
    }),
    description: new FormControl(this.data?.item?.description || '', [
      Validators.required,
    ]),
    measurementUnitIds: new FormArray([new FormControl('', [Validators.required])]),
  });

  get nameAr(): FormControl {
    return this.form.get('name.ar') as FormControl;
  }

  get nameEn(): FormControl {
    return this.form.get('name.en') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }

  get measurementUnitIds(): FormArray {
    return this.form.get('measurementUnitIds') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    this._translateService.get('general');
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(
      this._translateService.get('Materials.modal')
    );
    this._measurementUnitsClient
      .getAll(environment.apiVersion)
      .pipe(first())
      .subscribe((response: MeasurementUnitVm[]) => this.measurementUnits.set(response));

    if (
      this.data?.item?.measurementUnits &&
      this.data?.item?.measurementUnits.length > 0
    ) {
      this.measurementUnitIds.removeAt(0);
      this.data.item.measurementUnits.forEach((measurementUnit) => {
        this.measurementUnitIds.push(new FormControl(measurementUnit.id));
      });
    }
  }

  hasChanges(): boolean {
    return this.form.dirty;
  }
  save(): void {
    if (!this.hasChanges()) {
      this.close();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    const dto = new MaterialDto({
      name: new LocalizedStringDto({
        ar: formValue.name.ar,
        en: formValue.name.en,
      }),
      description: formValue.description,
      measurementUnitIds: formValue.measurementUnitIds,
    });

    if (this.data?.item?.id) {
      const actionUpdate = this._materialsClient.update(
        this.data.item.id,
        environment.apiVersion,
        dto
      );

      actionUpdate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._changeDetectorRef.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
          error: (err) => {
            this._handler.handleError(err).assignValidationErrors(this.form).pushError();
          },
        });
    } else {
      const actionCreate = this._materialsClient
        .create(environment.apiVersion, dto)
        .pipe(map(() => {}));

      actionCreate
        .pipe(
          finalize(() => {
            this.loading = false;
            this._changeDetectorRef.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.addedSuccessfully();
          },
          error: (err) =>
            this._handler.handleError(err).assignValidationErrors(this.form).pushError(),
        });
    }
  }

  addedSuccessfully(): void {
    const translation = this.translation.added;

    Swal.fire({
      text: translation.text,
      icon: 'success',
      buttonsStyling: false,
      confirmButtonText: translation.confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
    }).then(() => {
      this.form.reset();
      this.output.emit();
      this.close();
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  addMeasurementUnit(): void {
    this.measurementUnitIds.push(new FormControl('', [Validators.required]));
    this.form.markAsDirty();
  }

  removeMeasurementUnit(index: number): void {
    this.measurementUnitIds.removeAt(index);
    this.form.markAsDirty();
  }
}
