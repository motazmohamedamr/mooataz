import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  WritableSignal,
} from '@angular/core';
import { SupplierDetailsVm, SuppliersClient } from '@core/api';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-contractor-data',
  templateUrl: './contractor-data.component.html',
  styleUrl: './contractor-data.component.scss',
})
export class ContractorDataComponent implements OnChanges {
  private readonly _supplierClient = inject(SuppliersClient);

  @Input()
  translation: any;

  @Input()
  supplierId: string;

  supplier: WritableSignal<SupplierDetailsVm> = signal(null);

  async ngOnChanges(changes: SimpleChanges) {
    if (changes?.supplierId?.currentValue) {
      this.supplier.set(
        await firstValueFrom(
          this._supplierClient.get(
            changes.supplierId.currentValue,
            environment.apiVersion
          )
        )
      );
    }
  }
}

