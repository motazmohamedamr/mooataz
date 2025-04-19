import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loading = signal(false);

  isLoading = this.loading.asReadonly();

  showLoading() {
    this.loading.set(true);
  }

  hideLoading() {
    this.loading.set(false);
  }
}
