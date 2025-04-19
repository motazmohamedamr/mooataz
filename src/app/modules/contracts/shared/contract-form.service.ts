import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  BankGuaranteeDto,
  ContractAwardInfoDto,
  ContractClient,
  ContractDetailsDto,
  ContractFineDto,
  ContractMainDataDto,
  ContractMainDataVm,
  DelegationDto,
  DelegationsClient,
  FileResponse,
  HttpResultOfString,
} from '@core/api';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, Observable, pipe, take, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContractFormService {
  private readonly _contractClient = inject(ContractClient);
  private readonly _delegationsClient = inject(DelegationsClient);
  private readonly _handler = inject(ApiHandlerService);
  private readonly _toaster = inject(ToastrService);

  loadingSig = signal(false);
  currentContractId = signal(undefined);
  currentStepId = signal(undefined);
  lastStep: WritableSignal<number> = signal(0);
  stepEnabled: WritableSignal<number> = signal(1);

  getContractDetails(contractId: string): Observable<ContractMainDataVm> {
    return this._contractClient.getContractMainData(contractId, environment.apiVersion);
  }

  addContractMainData(
    formValue: ContractMainDataDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._contractClient.createContract(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateContractMainData(
    contractId: string,
    formValue: ContractMainDataDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._contractClient.updateContractMainData(
        contractId,
        environment.apiVersion,
        formValue
      ),
      successMsg
    );
  }

  addAwardData(
    formValue: ContractAwardInfoDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._contractClient.createContractAward(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateAwardData(
    contractId: string,
    formValue: ContractAwardInfoDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._contractClient.updateContractAwardData(
        contractId,
        environment.apiVersion,
        formValue
      ),
      successMsg
    );
  }

  addDelegationData(
    formValue: DelegationDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._delegationsClient.create(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateDelegationData(
    contractId: string,
    formValue: DelegationDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._delegationsClient.update(contractId, environment.apiVersion, formValue),
      successMsg
    );
  }

  addGuaranteeData(
    formValue: BankGuaranteeDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._contractClient.createBankGuarantee(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateGuaranteeData(
    contractId: string,
    formValue: BankGuaranteeDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._contractClient.updateBankGuarantee(
        contractId,
        environment.apiVersion,
        formValue
      ),
      successMsg
    );
  }

  addDetailData(
    formValue: ContractDetailsDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._contractClient.createContractDetails(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateDetailData(
    contractId: string,
    formValue: ContractDetailsDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._contractClient.updateContractDetails(
        contractId,
        environment.apiVersion,
        formValue
      ),
      successMsg
    );
  }

  addFineData(
    formValue: ContractFineDto,
    successMsg: string
  ): Observable<HttpResultOfString> {
    return this.contractFormObsSubmit(
      this._contractClient.createFine(environment.apiVersion, formValue),
      successMsg
    );
  }

  updateFineData(
    contractId: string,
    formValue: ContractFineDto,
    successMsg: string
  ): Observable<FileResponse> {
    return this.contractFormObsSubmit(
      this._contractClient.updateContractFine(contractId, formValue),
      successMsg
    );
  }

  setLoading(bool: boolean) {
    this.loadingSig.set(bool);
  }

  private contractFormObsSubmit<T>(
    source: Observable<T>,
    successMsg: string | null = null
  ): Observable<T> {
    return source.pipe(
      finalize(() => this.setLoading(false)),
      catchError((err: HttpErrorResponse) => {
        // this._handler.handleError(err.error).pushError();
        return throwError(err);
      }),
      take(1),
      tap(() => {
        if (successMsg) {
          this._toaster.success(successMsg, '', {
            positionClass: 'toast-bottom-center',
          });
        }
      })
    );
  }
}
