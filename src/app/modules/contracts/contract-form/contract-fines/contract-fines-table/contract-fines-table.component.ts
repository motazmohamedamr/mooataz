import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ContractClient, IContractFineVm } from '@core/api';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contract-fines-table',
  templateUrl: './contract-fines-table.component.html',
  styleUrl: './contract-fines-table.component.scss',
})
export class ContractFinesTableComponent {
  protected translateService = inject(TranslateService);
  private readonly _contractClient = inject(ContractClient);
  private readonly _contractFormService = inject(ContractFormService);
  private readonly _handler = inject(ApiHandlerService);
  protected readonly _toaster = inject(ToastrService);

  @Input()
  fineList: IContractFineVm[] = [];

  @Input()
  translation: any;

  @Output()
  openEditEvent = new EventEmitter<IContractFineVm>();

  @Output()
  deletFineEvent = new EventEmitter<IContractFineVm>();

  openEditDialog(fine: IContractFineVm): void {
    this.openEditEvent.emit(fine);
  }

  deleteFine(fine: IContractFineVm): void {
    this.deletFineEvent.emit(fine);
  }
}

