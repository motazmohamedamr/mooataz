import { Injectable, signal, WritableSignal } from '@angular/core';
import { ExtractRequestDetailsVm } from '@core/api';

@Injectable({ providedIn: 'root' })
export class TermsExtractsService {
  detailsOfExtract: WritableSignal<ExtractRequestDetailsVm> = signal(null);
  lastRequest: WritableSignal<ExtractRequestDetailsVm> = signal(null);
}
